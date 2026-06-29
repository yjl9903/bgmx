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

vi.mock('drizzle-orm', () => ({
  asc: vi.fn((column) => ({ type: 'asc', column })),
  gt: vi.fn((column, value) => ({ type: 'gt', column, value }))
}));

import { client } from '../src/bangumi';
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
    const database = createDatabase([{ id: 1 }]);

    const resp = await createTestApp(database).request('/bangumi/subjects');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('does not cache upstream error responses', async () => {
    vi.mocked(client.subject).mockRejectedValueOnce(new Error('upstream failed'));

    const resp = await createTestApp().request('/bangumi/subject/1');

    expect(resp.status).toBe(502);
    expect(resp.headers.get('Cache-Control')).toBeNull();
  });
});
