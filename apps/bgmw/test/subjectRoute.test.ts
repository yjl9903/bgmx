import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

vi.mock('../src/subject/database', () => ({
  createSubjectRevision: vi.fn(),
  deleteSubjectRevision: vi.fn(),
  deleteSubjectData: vi.fn(),
  fetchBangumiById: vi.fn(),
  fetchSubjectAllRevisions: vi.fn(),
  fetchSubjectById: vi.fn(),
  fetchSubjectDetailById: vi.fn(),
  fetchSubjectDetailsByIds: vi.fn(),
  fetchSubjectRevisions: vi.fn(),
  fetchSubjectsAfterCursor: vi.fn(),
  fetchSubjectsBySearchTitle: vi.fn(),
  updateSubject: vi.fn(),
  updateSubjectRevision: vi.fn()
}));

vi.mock('../src/bangumi', () => ({
  fetchAndUpdateBangumiSubject: vi.fn(),
  fetchAndUpdateRelatedBangumiSubjects: vi.fn()
}));

import {
  deleteSubjectRevision,
  deleteSubjectData,
  fetchBangumiById,
  fetchSubjectAllRevisions,
  fetchSubjectById,
  fetchSubjectDetailById,
  fetchSubjectDetailsByIds,
  fetchSubjectRevisions,
  fetchSubjectsAfterCursor,
  fetchSubjectsBySearchTitle,
  updateSubject,
  updateSubjectRevision
} from '../src/subject/database';
import { fetchAndUpdateBangumiSubject, fetchAndUpdateRelatedBangumiSubjects } from '../src/bangumi';
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

function createSubject(id: number, updated_at = new Date()) {
  return {
    id,
    title: `subject ${id}`,
    alias: { zh: [`条目 ${id}`] },
    poster: `poster-${id}.jpg`,
    onair_date: '2026-07-01',
    search: { include: [] },
    bangumi: {},
    tmdb: null,
    updated_at
  } as any;
}

function createSubjectDetail(id: number, bangumi_updated_at = new Date()) {
  return {
    subject: createSubject(id),
    relations: [],
    bangumi_updated_at
  };
}

describe('subject route cache headers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('caches public subject detail responses', async () => {
    vi.mocked(fetchSubjectDetailById).mockResolvedValueOnce(createSubjectDetail(1));
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/1');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchAndUpdateBangumiSubject).not.toHaveBeenCalled();
    expect(fetchSubjectRevisions).toHaveBeenCalledWith(expect.anything(), 1);
  });

  it('returns anime relations without their type', async () => {
    const relatedSubject = createSubject(20);
    vi.mocked(fetchSubjectDetailById).mockResolvedValueOnce({
      ...createSubjectDetail(1),
      relations: [
        { id: 10, type: 1, name: 'book', name_cn: '书籍', relation: '书籍' },
        {
          id: 20,
          type: 2,
          name: 'anime',
          name_cn: '动画',
          relation: '前传',
          images: {
            small: 'small.jpg',
            grid: 'grid.jpg',
            large: 'large.jpg',
            medium: 'medium.jpg',
            common: 'common.jpg'
          }
        },
        { id: 30, type: 3, name: 'music', name_cn: '音乐', relation: '片头曲' }
      ]
    });
    vi.mocked(fetchSubjectDetailsByIds).mockResolvedValueOnce([
      { subject: relatedSubject, bangumi_updated_at: new Date() }
    ]);
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/1');
    const json = (await resp.json()) as any;

    expect(json.data.relations).toEqual([
      {
        id: 20,
        title: 'subject 20',
        alias: { zh: ['条目 20'] },
        poster: 'poster-20.jpg',
        onair_date: '2026-07-01',
        relation: '前传'
      }
    ]);
    expect(json.data.relations[0]).not.toHaveProperty('type');
    expect(json.data.relations[0]).not.toHaveProperty('name');
    expect(json.data.relations[0]).not.toHaveProperty('search');
    expect(json.data.relations[0]).not.toHaveProperty('bangumi');
    expect(json.data.relations[0]).not.toHaveProperty('tmdb');
    expect(json.data.relations[0]).not.toHaveProperty('updated_at');
    expect(fetchSubjectDetailsByIds).toHaveBeenCalledWith(expect.anything(), [20]);
  });

  it('caches public subject list responses', async () => {
    vi.mocked(fetchSubjectsAfterCursor).mockResolvedValueOnce([createSubject(1)]);

    const resp = await createTestApp().request('/subjects');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(json.data[0].updated_at).toBeDefined();
    expect(json.data[0].updatedAt).toBeUndefined();
    expect(json.next_cursor).toBeNull();
    expect(json.nextCursor).toBeUndefined();
  });

  it('searches public subjects by title query', async () => {
    vi.mocked(fetchSubjectsBySearchTitle).mockResolvedValueOnce([createSubject(1)]);

    const resp = await createTestApp().request('/subjects?q=%E6%91%87%E6%BB%9A');

    expect(resp.status).toBe(200);
    expect(fetchSubjectsBySearchTitle).toHaveBeenCalledWith(expect.anything(), '摇滚', 0, 100);
    expect(fetchSubjectsAfterCursor).not.toHaveBeenCalled();
  });

  it('refreshes missing subject responses before returning', async () => {
    vi.mocked(fetchSubjectDetailById)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(createSubjectDetail(404));
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);
    vi.mocked(fetchAndUpdateBangumiSubject).mockResolvedValueOnce({ ok: true, data: {} } as any);

    const resp = await createTestApp().request('/subject/404');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
    expect(fetchAndUpdateBangumiSubject).toHaveBeenCalledOnce();
  });

  it('does not return stale subject when refresh fails', async () => {
    vi.mocked(fetchSubjectDetailById).mockResolvedValueOnce(
      createSubjectDetail(1, new Date('2026-01-01T00:00:00.000Z'))
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

  it('returns refreshed relations when Bangumi data is stale', async () => {
    vi.mocked(fetchSubjectDetailById)
      .mockResolvedValueOnce(createSubjectDetail(1, new Date('2026-01-01T00:00:00.000Z')))
      .mockResolvedValueOnce({
        ...createSubjectDetail(1),
        relations: [{ id: 20, type: 2, name: 'anime', name_cn: '动画', relation: '前传' }]
      });
    vi.mocked(fetchAndUpdateBangumiSubject).mockResolvedValueOnce({
      ok: true,
      data: {}
    } as any);
    vi.mocked(fetchSubjectDetailsByIds).mockResolvedValueOnce([
      { subject: createSubject(20), bangumi_updated_at: new Date() }
    ]);
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/1');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(fetchAndUpdateBangumiSubject).toHaveBeenCalledOnce();
    expect(json.data.relations[0]).toMatchObject({ id: 20, relation: '前传' });
  });

  it('upserts missing related anime subjects before returning them', async () => {
    const relation = {
      id: 20,
      type: 2,
      name: 'anime',
      name_cn: '动画',
      relation: '前传'
    };
    vi.mocked(fetchSubjectDetailById).mockResolvedValueOnce({
      ...createSubjectDetail(1),
      relations: [relation]
    });
    vi.mocked(fetchSubjectDetailsByIds)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ subject: createSubject(20), bangumi_updated_at: new Date() }]);
    vi.mocked(fetchAndUpdateRelatedBangumiSubjects).mockResolvedValueOnce({
      ok: true,
      data: []
    });
    vi.mocked(fetchSubjectRevisions).mockResolvedValueOnce([]);

    const resp = await createTestApp().request('/subject/1');
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(fetchAndUpdateRelatedBangumiSubjects).toHaveBeenCalledWith(expect.anything(), [
      relation
    ]);
    expect(json.data.relations[0]).toMatchObject({ id: 20, relation: '前传' });
  });

  it('lists all revisions including disabled revisions without caching', async () => {
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectAllRevisions).mockResolvedValueOnce([
      { id: 2, target_id: 1, enabled: false } as any
    ]);

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
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBeNull();
    expect(json.data.revisions).toEqual([{ id: 2, target_id: 1, enabled: false }]);
  });

  it('returns 404 when the revision list subject record is missing', async () => {
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(createSubject(1));
    vi.mocked(fetchSubjectById).mockResolvedValueOnce(undefined);

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
    const json = (await resp.json()) as any;

    expect(resp.status).toBe(404);
    expect(json).toEqual({ ok: false, error: 'Subject not found' });
    expect(fetchSubjectAllRevisions).not.toHaveBeenCalled();
  });

  it.each([true, false])('updates revision enabled state to %s through patch', async (enabled) => {
    const subject = createSubject(1);
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(subject);
    vi.mocked(updateSubjectRevision).mockResolvedValueOnce([]);
    vi.mocked(updateSubject).mockResolvedValueOnce({ ok: true, data: subject });

    const resp = await createTestApp().request(
      '/subject/1/revision/2',
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer secret',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      },
      {
        SECRET: 'secret'
      }
    );

    expect(resp.status).toBe(200);
    expect(updateSubjectRevision).toHaveBeenCalledWith(expect.anything(), 1, 2, {
      enabled
    });
  });

  it('physically deletes a revision through delete', async () => {
    const subject = createSubject(1);
    vi.mocked(fetchBangumiById).mockResolvedValueOnce(subject);
    vi.mocked(deleteSubjectRevision).mockResolvedValueOnce([]);
    vi.mocked(updateSubject).mockResolvedValueOnce({ ok: true, data: subject });

    const resp = await createTestApp().request(
      '/subject/1/revision/2',
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

    expect(resp.status).toBe(200);
    expect(deleteSubjectRevision).toHaveBeenCalledWith(expect.anything(), 1, 2);
    expect(updateSubjectRevision).not.toHaveBeenCalled();
  });

  it('refreshes subject through authenticated subject post', async () => {
    vi.mocked(fetchAndUpdateBangumiSubject).mockResolvedValueOnce({
      ok: true,
      data: createSubject(1)
    } as any);

    const resp = await createTestApp().request(
      '/subject/1',
      {
        method: 'POST',
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
    expect(fetchAndUpdateBangumiSubject).toHaveBeenCalledWith(expect.anything(), 1);
  });

  it('deletes subject data through authenticated subject delete', async () => {
    vi.mocked(deleteSubjectData).mockResolvedValueOnce(undefined);

    const resp = await createTestApp().request(
      '/subject/1',
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
    expect(deleteSubjectData).toHaveBeenCalledWith(expect.anything(), 1);
    expect(json).toEqual({
      ok: true,
      data: {
        id: 1
      }
    });
  });
});
