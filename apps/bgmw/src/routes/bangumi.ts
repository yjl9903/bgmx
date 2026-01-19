import { z } from 'zod';
import { Hono } from 'hono';
import { asc, gt } from 'drizzle-orm';

import { BgmFetchError } from 'bgmc';

import type { AppEnv } from '../env';

import { bangumis } from '../schema/subject';
import { client, fetchAndUpdateBangumiSubject } from '../bangumi';

import { zValidator } from './middlewares/zod';
import { authorization } from './middlewares/auth';

const router = new Hono<AppEnv>();

// 查询 bangumi calendar
router.get('/bangumi/calendar', async (c) => {
  const calendar = await client.calendar();

  return c.json({
    ok: true,
    data: calendar
  });
});

// 查询 bangumi subject
router.get(
  '/bangumi/subject/:id',
  zValidator('param', z.object({ id: z.coerce.number().gt(0) })),
  async (c) => {
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      const data = await client.subject(subjectId);

      return c.json(
        {
          ok: true,
          data
        },
        200
      );
    } catch (error) {
      if (error instanceof BgmFetchError && error.response.status === 404) {
        return c.json(
          {
            ok: false,
            error: 'Subject not found'
          },
          404
        );
      }

      console.error('[bgmw] failed to fetch subject', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          error: 'Failed to fetch subject'
        },
        502
      );
    }
  }
);

// 提交更新 bangumi subject
router.post(
  '/bangumi/subject/:id',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().gt(0) })),
  async (c) => {
    const subjectId = c.req.valid('param').id;

    const resp = await fetchAndUpdateBangumiSubject(c, subjectId);

    return c.json(resp, resp.ok ? 200 : 502);
  }
);

// 查询数据库中全部 bangumi 数据
router.get(
  '/bangumi/subjects',
  zValidator(
    'query',
    z.object({
      cursor: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().positive().max(1000).default(100)
    })
  ),
  async (c) => {
    const requestId = c.get('requestId');

    try {
      const { cursor, limit } = c.req.valid('query');

      const database = c.get('database');

      const data = await database
        .select()
        .from(bangumis)
        .where(gt(bangumis.id, cursor))
        .orderBy(asc(bangumis.id))
        .limit(limit);

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
      console.error('[bgmw] failed to fetch bangumis', error, { requestId });

      return c.json(
        {
          ok: false,
          error: 'Failed to fetch bangumi list'
        },
        502
      );
    }
  }
);

export const bangumiRoute = router;
