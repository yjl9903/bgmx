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
  updateSubject: vi.fn()
}));

import {
  fetchBangumiById,
  fetchSubjectAllRevisions,
  fetchSubjectById,
  fetchSubjectRevisions,
  fetchSubjectsAfterCursor
} from '../src/subject/database';
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

function createSubject(id: number) {
  return {
    id,
    title: `subject ${id}`,
    data: {},
    search: {},
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
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
  });

  it('caches public subject list responses', async () => {
    vi.mocked(fetchSubjectsAfterCursor).mockResolvedValueOnce([createSubject(1)]);

    const resp = await createTestApp().request('/subjects');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('does not cache missing subject responses', async () => {
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(undefined);
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/404');

    expect(resp.status).toBe(404);
    expect(resp.headers.get('Cache-Control')).toBeNull();
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
