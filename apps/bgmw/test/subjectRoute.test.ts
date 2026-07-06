import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

vi.mock('../src/subject/database', () => ({
  createSubjectRevision: vi.fn(),
  disableSubjectRevision: vi.fn(),
  enableSubjectRevision: vi.fn(),
  fetchBangumiById: vi.fn(),
  fetchSubjectAllRevisions: vi.fn(),
  fetchSubjectById: vi.fn(),
  fetchSubjectRevisions: vi.fn(),
  fetchSubjectsAfterCursor: vi.fn(),
  fetchSubjectsBySearchTitle: vi.fn(),
  updateSubject: vi.fn()
}));

vi.mock('../src/bangumi', () => ({
  fetchAndUpdateBangumiSubject: vi.fn()
}));

import {
  fetchBangumiById,
  fetchSubjectAllRevisions,
  fetchSubjectById,
  fetchSubjectRevisions,
  fetchSubjectsAfterCursor,
  fetchSubjectsBySearchTitle
} from '../src/subject/database';
import { fetchAndUpdateBangumiSubject } from '../src/bangumi';
import { subjectRoute } from '../src/routes/subject';
import { PUBLIC_CACHE_CONTROL } from '../src/routes/middlewares/cache';

function createTestApp() {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request');
    await next();
  });
  app.route('/', subjectRoute);

  return app;
}

function createSubject(id: number, updatedAt = new Date()) {
  return {
    id,
    title: `subject ${id}`,
    data: {},
    search: {},
    updatedAt
  } as any;
}

describe('subject route cache headers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('caches public subject detail responses', async () => {
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/1');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchAndUpdateBangumiSubject).not.toHaveBeenCalled();
  });

  it('caches public subject list responses', async () => {
    vi.mocked(fetchSubjectsAfterCursor).mockResolvedValueOnce([createSubject(1)]);

    const resp = await createTestApp().request('/subjects');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('searches public subjects by title query', async () => {
    vi.mocked(fetchSubjectsBySearchTitle).mockResolvedValueOnce([createSubject(1)]);

    const resp = await createTestApp().request('/subjects?q=%E6%91%87%E6%BB%9A');

    expect(resp.status).toBe(200);
    expect(fetchSubjectsBySearchTitle).toHaveBeenCalledWith(expect.anything(), '摇滚', 0, 100);
    expect(fetchSubjectsAfterCursor).not.toHaveBeenCalled();
  });

  it('refreshes missing subject responses before returning', async () => {
    vi.mocked(fetchSubjectById)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(createSubject(404));
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);
    vi.mocked(fetchAndUpdateBangumiSubject).mockResolvedValueOnce({ ok: true, data: {} } as any);

    const resp = await createTestApp().request('/subject/404');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchAndUpdateBangumiSubject).toHaveBeenCalledOnce();
  });

  it('does not return stale subject when refresh fails', async () => {
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(
      createSubject(1, new Date('2026-01-01T00:00:00.000Z'))
    );
    vi.mocked(fetchAndUpdateBangumiSubject).mockResolvedValueOnce({
      ok: false,
      error: new Error('upstream failed')
    });

    const resp = await createTestApp().request('/subject/1');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(502);
    expect(resp.headers.get('Cache-Control')).toBeNull();
    expect(json).toEqual({ ok: false, error: 'Failed to refresh subject' });
    expect(fetchSubjectRevisions).not.toHaveBeenCalled();
  });

  it('does not cache authenticated revision responses', async () => {
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectAllRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request(
      '/subject/1/revisions',
      {
        headers: {
          Authorization: 'Bearer secret'
        }
      },
      {
        SECRET: 'secret'
      }
    );

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBeNull();
  });
});
