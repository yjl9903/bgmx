import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

vi.mock('../src/bangumi', () => ({
  client: {
    calendar: vi.fn(),
    subject: vi.fn()
  },
  fetchAndUpdateBangumiSubject: vi.fn()
}));

vi.mock('../src/subject/database', () => ({
  fetchBangumiById: vi.fn()
}));

vi.mock('drizzle-orm', () => ({
  asc: vi.fn((column) => ({ type: 'asc', column })),
  gt: vi.fn((column, value) => ({ type: 'gt', column, value }))
}));

import { client } from '../src/bangumi';
import { fetchBangumiById } from '../src/subject/database';
import { bangumiRoute } from '../src/routes/bangumi';
import { PUBLIC_CACHE_CONTROL } from '../src/routes/middlewares/cache';

function createTestApp(database: unknown = undefined) {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request');
    if (database) {
      c.set('database', database as AppEnv['Variables']['database']);
    }
    await next();
  });
  app.route('/', bangumiRoute);

  return app;
}

function createDatabase(rows: unknown[]) {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => rows)
          }))
        }))
      }))
    }))
  };
}

describe('bangumi route cache headers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('caches public bangumi calendar responses', async () => {
    vi.mocked(client.calendar).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/bangumi/calendar');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('caches public bangumi subject responses', async () => {
    vi.mocked(client.subject).mockResolvedValueOnce({ id: 1 } as any);

    const resp = await createTestApp().request('/bangumi/subject/1');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('caches public bangumi subject list responses', async () => {
    const database = createDatabase([{ id: 1, updated_at: new Date('2026-01-01T00:00:00.000Z') }]);

    const resp = await createTestApp(database).request('/bangumi/subjects');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(json.data[0].updated_at).toBeDefined();
    expect(json.data[0].updatedAt).toBeUndefined();
    expect(json.next_cursor).toBeNull();
    expect(json.nextCursor).toBeUndefined();
  });

  it('does not cache upstream error responses', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(client.subject).mockRejectedValueOnce(new Error('upstream failed'));

    try {
      const resp = await createTestApp().request('/bangumi/subject/1');

      expect(resp.status).toBe(502);
      expect(resp.headers.get('Cache-Control')).toBeNull();
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe('bangumi subject poster route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  function createSubjectData() {
    return {
      images: {
        small: 'https://lain.bgm.tv/small.jpg',
        grid: 'https://lain.bgm.tv/grid.jpg',
        large: 'https://lain.bgm.tv/large.jpg',
        medium: 'https://lain.bgm.tv/medium.jpg',
        common: 'https://lain.bgm.tv/common.jpg'
      }
    } as any;
  }

  function mockCachedSubjectImages() {
    vi.mocked(fetchBangumiById).mockResolvedValueOnce({
      data: createSubjectData()
    } as any);
  }

  it('proxies the common poster by default', async () => {
    mockCachedSubjectImages();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('common poster', {
        headers: {
          'Content-Type': 'image/jpeg',
          ETag: 'poster-etag'
        }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const resp = await createTestApp().request('/bangumi/subject/1/poster.jpg');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('image/jpeg');
    expect(resp.headers.get('ETag')).toBe('poster-etag');
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(await resp.text()).toBe('common poster');
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://lain.bgm.tv/common.jpg'));
    expect(fetchBangumiById).toHaveBeenCalledWith(expect.anything(), 1);
    expect(client.subject).not.toHaveBeenCalled();
  });

  it('selects the requested poster quality independently of the extension', async () => {
    mockCachedSubjectImages();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('large poster', { headers: { 'Content-Type': 'image/jpeg' } })
      );
    vi.stubGlobal('fetch', fetchMock);

    const resp = await createTestApp().request('/bangumi/subject/1/poster.png?quality=large');

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('large poster');
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://lain.bgm.tv/large.jpg'));
  });

  it('falls back to Bangumi when the subject is not cached', async () => {
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(undefined);
    vi.mocked(client.subject).mockResolvedValueOnce(createSubjectData());
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('fallback poster', { headers: { 'Content-Type': 'image/jpeg' } })
      );
    vi.stubGlobal('fetch', fetchMock);

    const resp = await createTestApp().request('/bangumi/subject/1/poster.jpg');

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('fallback poster');
    expect(client.subject).toHaveBeenCalledWith(1);
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://lain.bgm.tv/common.jpg'));
  });

  it('rejects an unsupported poster quality', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const resp = await createTestApp().request('/bangumi/subject/1/poster.webp?quality=original');

    expect(resp.status).toBe(400);
    expect(client.subject).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an uncached gateway error when the poster origin fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCachedSubjectImages();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('upstream error', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      const resp = await createTestApp().request('/bangumi/subject/1/poster.jpg');

      expect(resp.status).toBe(502);
      expect(resp.headers.get('Cache-Control')).toBeNull();
      expect(await resp.json()).toEqual({
        ok: false,
        error: 'Failed to fetch subject poster'
      });
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});
