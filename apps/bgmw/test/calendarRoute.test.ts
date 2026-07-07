import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

vi.mock('../src/calendar/database', () => ({
  deleteCalendar: vi.fn(),
  fetchCalendarRows: vi.fn(),
  fetchCalendars: vi.fn(),
  upsertCalendar: vi.fn()
}));

import {
  deleteCalendar,
  fetchCalendarRows,
  fetchCalendars,
  upsertCalendar
} from '../src/calendar/database';
import { calendarRoute } from '../src/routes/calendar';
import { PUBLIC_CACHE_CONTROL } from '../src/routes/middlewares/cache';

function createTestApp() {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request');
    await next();
  });
  app.route('/', calendarRoute);

  return app;
}

function createSubject(id: number) {
  return {
    id,
    title: `subject ${id}`,
    data: {},
    search: {},
    updated_at: new Date('2026-01-01T00:00:00.000Z')
  } as any;
}

function createCalendar(season: string, updated_at = new Date('2026-07-01T00:00:00.000Z')) {
  return {
    season,
    is_active: true,
    updated_at
  };
}

describe('calendar route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty calendar and web when no active seasons match', async () => {
    vi.mocked(fetchCalendarRows).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/calendar');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchCalendarRows).toHaveBeenCalledWith(expect.anything(), undefined);
    expect(json).toEqual({
      ok: true,
      data: {
        seasons: [],
        updated_at: null,
        calendar: [[], [], [], [], [], [], []],
        web: []
      }
    });
  });

  it('returns active seasons without calendar rows', async () => {
    vi.mocked(fetchCalendarRows).mockResolvedValueOnce([
      {
        calendar: createCalendar('2026-07'),
        relation: null,
        subject: null
      }
    ]);

    const resp = await createTestApp().request('/calendar');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(json.data).toEqual({
      seasons: ['2026-07'],
      updated_at: '2026-07-01T00:00:00.000Z',
      calendar: [[], [], [], [], [], [], []],
      web: []
    });
  });

  it('merges queried seasons into the old calendar response shape', async () => {
    vi.mocked(fetchCalendarRows).mockResolvedValueOnce([
      {
        calendar: createCalendar('2026-04', new Date('2026-04-01T00:00:00.000Z')),
        relation: {
          id: 1,
          season: '2026-04',
          subject_id: 1,
          platform: 'tv',
          weekday: 1
        },
        subject: createSubject(1)
      },
      {
        calendar: createCalendar('2026-07', new Date('2026-07-01T00:00:00.000Z')),
        relation: {
          id: 3,
          season: '2026-07',
          subject_id: 3,
          platform: 'tv',
          weekday: 1
        },
        subject: createSubject(3)
      },
      {
        calendar: createCalendar('2026-07', new Date('2026-07-01T00:00:00.000Z')),
        relation: {
          id: 4,
          season: '2026-07',
          subject_id: 1,
          platform: 'tv',
          weekday: 1
        },
        subject: createSubject(1)
      },
      {
        calendar: createCalendar('2026-07', new Date('2026-07-01T00:00:00.000Z')),
        relation: {
          id: 2,
          season: '2026-07',
          subject_id: 2,
          platform: 'web',
          weekday: null
        },
        subject: createSubject(2)
      }
    ]);

    const resp = await createTestApp().request('/calendar?season=2026-04&season=2026-07');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchCalendarRows).toHaveBeenCalledWith(expect.anything(), ['2026-04', '2026-07']);
    expect(json.data.seasons).toEqual(['2026-04', '2026-07']);
    expect(json.data.updated_at).toBe('2026-07-01T00:00:00.000Z');
    expect(json.data.calendar[1].map((item: any) => item.id)).toEqual([3, 1]);
    expect(json.data.web).toHaveLength(1);
    expect(json.data.web[0]).toMatchObject({
      id: 2,
      platform: 'web',
      weekday: null
    });
  });

  it('lists all calendar seasons', async () => {
    vi.mocked(fetchCalendars).mockResolvedValueOnce([
      createCalendar('2026-04', new Date('2026-04-01T00:00:00.000Z')),
      createCalendar('2026-07', new Date('2026-07-01T00:00:00.000Z'))
    ]);

    const resp = await createTestApp().request('/calendars');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchCalendars).toHaveBeenCalledWith(expect.anything());
    expect(json.data).toEqual([
      {
        season: '2026-04',
        is_active: true,
        updated_at: '2026-04-01T00:00:00.000Z'
      },
      {
        season: '2026-07',
        is_active: true,
        updated_at: '2026-07-01T00:00:00.000Z'
      }
    ]);
  });

  it('updates only is_active when calendar is omitted', async () => {
    vi.mocked(upsertCalendar).mockResolvedValueOnce({
      ok: true,
      data: {
        season: '2026-04',
        is_active: true,
        updated_at: new Date('2026-04-01T00:00:00.000Z'),
        calendar: []
      }
    });

    const resp = await createTestApp().request(
      '/calendar',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer secret',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          season: '2026-04',
          is_active: true
        })
      },
      {
        SECRET: 'secret'
      }
    );
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBeNull();
    expect(upsertCalendar).toHaveBeenCalledWith(expect.anything(), {
      season: '2026-04',
      isActive: true,
      calendar: undefined
    });
    expect(json.data).toEqual({
      season: '2026-04',
      is_active: true,
      updated_at: '2026-04-01T00:00:00.000Z',
      calendar: []
    });
  });

  it('replaces calendar relations when calendar is provided', async () => {
    vi.mocked(upsertCalendar).mockResolvedValueOnce({
      ok: true,
      data: {
        season: '2026-04',
        is_active: false,
        updated_at: new Date('2026-04-01T00:00:00.000Z'),
        calendar: [
          {
            subject_id: 1,
            platform: 'tv',
            weekday: 0
          }
        ]
      }
    });

    const resp = await createTestApp().request(
      '/calendar',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer secret',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          season: '2026-04',
          calendar: [
            {
              subject_id: 1,
              platform: 'tv',
              weekday: 0
            }
          ]
        })
      },
      {
        SECRET: 'secret'
      }
    );

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBeNull();
    expect(upsertCalendar).toHaveBeenCalledWith(expect.anything(), {
      season: '2026-04',
      isActive: undefined,
      calendar: [
        {
          subject_id: 1,
          platform: 'tv',
          weekday: 0
        }
      ]
    });
  });

  it('deletes a calendar season from query season', async () => {
    vi.mocked(deleteCalendar).mockResolvedValueOnce(undefined);

    const resp = await createTestApp().request(
      '/calendar?season=2026-04',
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer secret'
        }
      },
      {
        SECRET: 'secret'
      }
    );
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBeNull();
    expect(deleteCalendar).toHaveBeenCalledWith(expect.anything(), '2026-04');
    expect(json).toEqual({
      ok: true,
      data: {
        season: '2026-04'
      }
    });
  });

  it('rejects invalid season formats', async () => {
    const getResp = await createTestApp().request('/calendar?season=2026-03');
    const deleteResp = await createTestApp().request(
      '/calendar?season=2026-03',
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer secret'
        }
      },
      {
        SECRET: 'secret'
      }
    );

    expect(getResp.status).toBe(400);
    expect(deleteResp.status).toBe(400);
    expect(getResp.headers.get('Cache-Control')).toBeNull();
    expect(deleteResp.headers.get('Cache-Control')).toBeNull();
    expect(fetchCalendarRows).not.toHaveBeenCalled();
    expect(deleteCalendar).not.toHaveBeenCalled();
  });
});
