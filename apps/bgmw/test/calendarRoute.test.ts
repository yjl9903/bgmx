import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

vi.mock('../src/calendar/database', () => ({
  deleteCalendar: vi.fn(),
  fetchCalendarRows: vi.fn(),
  upsertCalendar: vi.fn()
}));

import { deleteCalendar, fetchCalendarRows, upsertCalendar } from '../src/calendar/database';
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
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  } as any;
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
        calendar: [[], [], [], [], [], [], []],
        web: []
      }
    });
  });

  it('merges queried seasons into the old calendar response shape', async () => {
    vi.mocked(fetchCalendarRows).mockResolvedValueOnce([
      {
        relation: {
          id: 1,
          season: '2026-04',
          subjectId: 1,
          platform: 'tv',
          weekday: 1
        },
        subject: createSubject(1)
      },
      {
        relation: {
          id: 2,
          season: '2026-07',
          subjectId: 2,
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
    expect(json.data.calendar[1]).toHaveLength(1);
    expect(json.data.calendar[1][0]).toMatchObject({
      id: 1,
      platform: 'tv',
      weekday: 1
    });
    expect(json.data.web).toHaveLength(1);
    expect(json.data.web[0]).toMatchObject({
      id: 2,
      platform: 'web',
      weekday: null
    });
  });

  it('updates only is_active when calendar is omitted', async () => {
    vi.mocked(upsertCalendar).mockResolvedValueOnce({
      ok: true,
      data: {
        season: '2026-04',
        is_active: true,
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
      calendar: []
    });
  });

  it('replaces calendar relations when calendar is provided', async () => {
    vi.mocked(upsertCalendar).mockResolvedValueOnce({
      ok: true,
      data: {
        season: '2026-04',
        is_active: false,
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
