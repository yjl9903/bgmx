import { z } from 'zod';
import { Hono } from 'hono';

import type { AppEnv } from '../env';

import { deleteCalendar, fetchCalendarRows, upsertCalendar } from '../calendar/database';
import { type CalendarSubject } from '../schema';

import { zValidator } from './middlewares/zod';
import { authorization } from './middlewares/auth';
import { publicCache } from './middlewares/cache';

const router = new Hono<AppEnv>();

const seasonSchema = z.string().regex(/^\d{4}-(?:01|04|07|10)$/);

const calendarInputSchema = z.object({
  subject_id: z.coerce.number().int().gt(0),
  platform: z.enum(['tv', 'web']),
  weekday: z.coerce.number().int().min(0).max(6).nullable().optional().default(null)
});

function validateSeasons(seasons: string[]) {
  return z.array(seasonSchema).safeParse(seasons);
}

router.get('/calendar', publicCache(), async (c) => {
  const requestId = c.get('requestId');
  const queriedSeasons = c.req.queries('season') ?? [];
  const seasons = queriedSeasons.length > 0 ? validateSeasons(queriedSeasons) : undefined;

  if (seasons && !seasons.success) {
    return c.json(
      {
        ok: false,
        error: 'Invalid season'
      },
      400
    );
  }

  try {
    const resp = await fetchCalendarRows(c, seasons?.data);

    const calendar: CalendarSubject[][] = [[], [], [], [], [], [], []];
    const web: CalendarSubject[] = [];

    for (const item of resp) {
      const subject: CalendarSubject = {
        ...item.subject,
        platform: item.relation.platform,
        weekday: item.relation.weekday
      };
      if (item.relation.platform === 'tv' && item.relation.weekday !== null) {
        calendar[item.relation.weekday]?.push(subject);
      } else {
        web.push(subject);
      }
    }

    return c.json({
      ok: true,
      data: {
        calendar,
        web
      }
    });
  } catch (error) {
    console.error('[bgmw] failed to fetch calendar', error, { requestId });

    return c.json(
      {
        ok: false,
        error: 'Failed to fetch calendar'
      },
      500
    );
  }
});

router.post(
  '/calendar',
  authorization,
  zValidator(
    'json',
    z.object({
      season: seasonSchema,
      is_active: z.boolean().optional(),
      calendar: z.array(calendarInputSchema).optional()
    })
  ),
  async (c) => {
    const requestId = c.get('requestId');
    const body = c.req.valid('json');

    try {
      const resp = await upsertCalendar(c, {
        season: body.season,
        isActive: body.is_active,
        calendar: body.calendar
      });

      if (resp.ok) {
        return c.json(
          {
            ok: true,
            data: resp.data
          },
          200
        );
      } else {
        return c.json(
          {
            ok: false,
            error: resp.error?.message ?? 'Unknown error'
          },
          500
        );
      }
    } catch (error) {
      console.error('[bgmw] failed to update calendar', error, { requestId });

      return c.json(
        {
          ok: false,
          error: 'Failed to update calendar'
        },
        500
      );
    }
  }
);

router.delete('/calendar', authorization, async (c) => {
  const requestId = c.get('requestId');
  const season = seasonSchema.safeParse(c.req.query('season'));

  if (!season.success) {
    return c.json(
      {
        ok: false,
        error: 'Invalid season'
      },
      400
    );
  }

  try {
    await deleteCalendar(c, season.data);

    return c.json(
      {
        ok: true,
        data: {
          season: season.data
        }
      },
      200
    );
  } catch (error) {
    console.error('[bgmw] failed to delete calendar', error, { requestId });

    return c.json(
      {
        ok: false,
        error: 'Failed to delete calendar'
      },
      500
    );
  }
});

export const calendarRoute = router;
