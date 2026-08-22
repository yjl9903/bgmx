import { z } from 'zod';
import { Hono } from 'hono';

import type { AppEnv } from '../env';
import type { Bangumi, SubjectRelation } from '../schema/types';

import { fetchAndUpdateBangumiSubject, fetchAndUpdateRelatedBangumiSubjects } from '../bangumi';
import {
  createSubjectRevision,
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
} from '../subject/database';

import { zValidator } from './middlewares/zod';
import { authorization } from './middlewares/auth';
import { publicCache } from './middlewares/cache';

const router = new Hono<AppEnv>();

const SUBJECT_STALE_MS = 24 * 60 * 60 * 1000;

function isSubjectStale(subject: Pick<Bangumi, 'updated_at'>) {
  return Date.now() - new Date(subject.updated_at).getTime() > SUBJECT_STALE_MS;
}

function getAnimeRelations(relations: Bangumi['subjects']) {
  return relations.filter((relation) => relation.type === 2);
}

// 查询数据库中的单个 subject
router.get(
  '/subject/:id',
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  publicCache(),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      let detail = await fetchSubjectDetailById(c, subjectId);

      if (!detail || isSubjectStale({ updated_at: detail.bangumi_updated_at })) {
        const refreshed = await fetchAndUpdateBangumiSubject(c, subjectId);
        if (!refreshed.ok) {
          return c.json(
            {
              ok: false,
              error: 'Failed to refresh subject'
            },
            502
          );
        }

        detail = await fetchSubjectDetailById(c, subjectId);
      }

      if (!detail) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const animeRelations = getAnimeRelations(detail.relations);
      const relatedSubjectIds = [...new Set(animeRelations.map((relation) => relation.id))];
      let relatedDetails =
        relatedSubjectIds.length > 0 ? await fetchSubjectDetailsByIds(c, relatedSubjectIds) : [];
      let relatedById = new Map(relatedDetails.map((item) => [item.subject.id, item]));
      const staleRelations = animeRelations.filter((relation) => {
        const related = relatedById.get(relation.id);
        return !related || isSubjectStale({ updated_at: related.bangumi_updated_at });
      });

      if (staleRelations.length > 0) {
        const refreshed = await fetchAndUpdateRelatedBangumiSubjects(c, staleRelations);
        if (!refreshed.ok) {
          return c.json(
            {
              ok: false,
              error: 'Failed to refresh subject relations'
            },
            502
          );
        }

        relatedDetails = await fetchSubjectDetailsByIds(c, relatedSubjectIds);
        relatedById = new Map(relatedDetails.map((item) => [item.subject.id, item]));
      }

      const relations = animeRelations.map((relation): SubjectRelation => {
        const related = relatedById.get(relation.id);
        if (!related) {
          throw new Error(`Related subject ${relation.id} not found after refresh`);
        }

        const { id, title, alias, poster, onair_date } = related.subject;

        return {
          id,
          title,
          alias,
          poster,
          onair_date,
          relation: relation.relation
        };
      });

      const revisions = await fetchSubjectRevisions(c, subjectId);

      return c.json(
        {
          ok: true,
          data: {
            revisions,
            subject: detail.subject,
            relations
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to fetch subject', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to fetch subject'
        },
        500
      );
    }
  }
);

// 刷新 bangumi 数据并更新 subject
router.post(
  '/subject/:id',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  async (c) => {
    const subjectId = c.req.valid('param').id;
    const resp = await fetchAndUpdateBangumiSubject(c, subjectId);

    return c.json(resp, resp.ok ? 200 : 502);
  }
);

// 删除该 subject 关联的所有数据
router.delete(
  '/subject/:id',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      await deleteSubjectData(c, subjectId);

      return c.json(
        {
          ok: true,
          data: {
            id: subjectId
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to delete subject', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to delete subject'
        },
        500
      );
    }
  }
);

// 创建 revision 更新单个 subject
router.post(
  '/subject/:id/revision',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  zValidator(
    'json',
    z.object({
      detail: z.discriminatedUnion('operation', [
        z.object({
          operation: z.literal('set.add'),
          path: z.string().min(1),
          value: z.array(z.string())
        }),
        z.object({
          operation: z.literal('set.delete'),
          path: z.string().min(1),
          value: z.array(z.string())
        }),
        z.object({
          operation: z.literal('field.set'),
          path: z.string().min(1),
          value: z.unknown()
        })
      ])
    })
  ),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;
    const { detail } = c.req.valid('json');

    try {
      const bangumi = await fetchBangumiById(c, subjectId);

      if (!bangumi) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const revisions = await createSubjectRevision(c, subjectId, detail);
      const updated = await updateSubject(c, bangumi, revisions);

      return c.json(
        {
          ok: true,
          data: {
            revisions,
            subject: updated.data
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to create revision', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to create revision'
        },
        500
      );
    }
  }
);

// 获取 subject 的所有 revisions
router.get(
  '/subject/:id/revisions',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      const bangumi = await fetchBangumiById(c, subjectId);

      if (!bangumi) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const subject = await fetchSubjectById(c, subjectId);

      if (!subject) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const revisions = await fetchSubjectAllRevisions(c, subjectId);

      return c.json(
        {
          ok: true,
          data: {
            revisions,
            subject
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to list revision', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to list revision'
        },
        500
      );
    }
  }
);

// 更新该 subject 下某一条 revision 的启用状态
router.patch(
  '/subject/:id/revision/:rid',
  authorization,
  zValidator(
    'param',
    z.object({ id: z.coerce.number().int().gt(0), rid: z.coerce.number().int().gte(0) })
  ),
  zValidator('json', z.object({ enabled: z.boolean() })),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;
    const revisionId = c.req.valid('param').rid;
    const { enabled } = c.req.valid('json');

    try {
      const bangumi = await fetchBangumiById(c, subjectId);

      if (!bangumi) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const revisions = await updateSubjectRevision(c, subjectId, revisionId, { enabled });
      const updated = await updateSubject(c, bangumi, revisions);

      return c.json(
        {
          ok: true,
          data: {
            revisions,
            subject: updated.data
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to update revision enabled state', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to update revision enabled state'
        },
        500
      );
    }
  }
);

// 物理删除该 subject 下的某一条 revision
router.delete(
  '/subject/:id/revision/:rid',
  authorization,
  zValidator(
    'param',
    z.object({ id: z.coerce.number().int().gt(0), rid: z.coerce.number().int().gte(0) })
  ),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;
    const revisionId = c.req.valid('param').rid;

    try {
      const bangumi = await fetchBangumiById(c, subjectId);

      if (!bangumi) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const revisions = await deleteSubjectRevision(c, subjectId, revisionId);
      const updated = await updateSubject(c, bangumi, revisions);

      return c.json(
        {
          ok: true,
          data: {
            revisions,
            subject: updated.data
          }
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to delete revision', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to delete revision'
        },
        500
      );
    }
  }
);

// 游标方式查询 subject 列表
router.get(
  '/subjects',
  zValidator(
    'query',
    z.object({
      cursor: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().positive().max(1000).default(100),
      q: z.string().optional()
    })
  ),
  publicCache(),
  async (c) => {
    const requestId = c.get('requestId');

    try {
      const { cursor, limit, q } = c.req.valid('query');

      const data =
        q === undefined
          ? await fetchSubjectsAfterCursor(c, cursor, limit)
          : await fetchSubjectsBySearchTitle(c, q, cursor, limit);

      const next_cursor =
        data.length === limit && data.length > 0 ? (data[data.length - 1]?.id ?? null) : null;

      return c.json(
        {
          ok: true,
          data,
          next_cursor
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to fetch subjects', error, { requestId });

      return c.json(
        {
          ok: false,
          error: 'Failed to fetch subject list'
        },
        500
      );
    }
  }
);

export const subjectRoute = router;
