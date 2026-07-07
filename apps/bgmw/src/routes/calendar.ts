import { z } from 'zod';
import { Hono } from 'hono';

import type { AppEnv } from '../env';
import type { CalendarSubject } from '../schema/types';

import {
  deleteCalendar,
  fetchCalendarRows,
  fetchCalendars,
  upsertCalendar
} from '../calendar/database';

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

function dedupeAndSortCalendarSubjects(subjects: CalendarSubject[]) {
  const seen = new Set<number>();
  subjects.sort((a, b) => b.id - a.id);
  for (let i = 0; i < subjects.length; i++) {
    if (seen.has(subjects[i].id)) {
      subjects.splice(i, 1);
      i--;
    } else {
      seen.add(subjects[i].id);
    }
  }
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
    const effectiveSeasons = new Set<string>();
    let updatedAt: Date | null = null;

    for (const item of resp) {
      effectiveSeasons.add(item.calendar.season);
      if (!updatedAt || item.calendar.updated_at > updatedAt) {
        updatedAt = item.calendar.updated_at;
      }
      if (!item.relation || !item.subject) {
        continue;
      }
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
    for (const row of calendar) {
      dedupeAndSortCalendarSubjects(row);
    }
    dedupeAndSortCalendarSubjects(web);

    return c.json({
      ok: true,
      data: {
        seasons: [...effectiveSeasons],
        updated_at: updatedAt,
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

router.get('/calendars', publicCache(), async (c) => {
  const requestId = c.get('requestId');

  try {
    const calendars = await fetchCalendars(c);

    return c.json({
      ok: true,
      data: calendars
    });
  } catch (error) {
    console.error('[bgmw] failed to fetch calendars', error, { requestId });

    return c.json(
      {
        ok: false,
        error: 'Failed to fetch calendars'
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
