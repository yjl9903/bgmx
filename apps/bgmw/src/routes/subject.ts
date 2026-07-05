import { z } from 'zod';
import { Hono } from 'hono';

import type { AppEnv } from '../env';
import type { Subject } from '../schema/types';

import { fetchAndUpdateBangumiSubject } from '../bangumi';
import {
  createSubjectRevision,
  disableSubjectRevision,
  enableSubjectRevision,
  fetchBangumiById,
  fetchSubjectAllRevisions,
  fetchSubjectById,
  fetchSubjectRevisions,
  fetchSubjectsAfterCursor,
  updateSubject
} from '../subject/database';

import { zValidator } from './middlewares/zod';
import { authorization } from './middlewares/auth';
import { publicCache } from './middlewares/cache';

const router = new Hono<AppEnv>();
const SUBJECT_STALE_MS = 24 * 60 * 60 * 1000;

// 查询数据库中的单个 subject
router.get(
  '/subject/:id',
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  publicCache(),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      let subject = await fetchSubjectById(c, subjectId);

      if (!subject || isSubjectStale(subject)) {
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

        subject = await fetchSubjectById(c, subjectId);
      }

      if (!subject) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      const revisions = await fetchSubjectRevisions(c, subjectId);

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

function isSubjectStale(subject: Pick<Subject, 'updatedAt'>) {
  return Date.now() - new Date(subject.updatedAt).getTime() > SUBJECT_STALE_MS;
}

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

// 禁用该 subject 下的某一条 revision
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

      const revisions = await disableSubjectRevision(c, subjectId, revisionId);
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
      console.error('[bgmw] failed to disable revision', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to disable revision'
        },
        500
      );
    }
  }
);

// 启用该 subject 下的某一条 revision
router.put(
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

      const revisions = await enableSubjectRevision(c, subjectId, revisionId);
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
      console.error('[bgmw] failed to enable revision', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to enable revision'
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
      limit: z.coerce.number().int().positive().max(1000).default(100)
    })
  ),
  publicCache(),
  async (c) => {
    const requestId = c.get('requestId');

    try {
      const { cursor, limit } = c.req.valid('query');

      const data = await fetchSubjectsAfterCursor(c, cursor, limit);

      const nextCursor =
        data.length === limit && data.length > 0 ? (data[data.length - 1]?.id ?? null) : null;

      return c.json(
        {
          ok: true,
          data,
          nextCursor
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
