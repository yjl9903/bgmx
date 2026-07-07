import { asc, eq, inArray } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';

import type { Context } from '../env';
import type {
  Calendar,
  CalendarInput,
  CalendarUpdateInput,
  CalendarUpdateResult
} from '../schema/types';
import {
  calendarRelations as calendarRelationsSchema,
  calendars as calendarsSchema,
  subjects as subjectsSchema
} from '../schema';

export async function fetchCalendarRows(ctx: Context, seasons?: string[]) {
  const database = ctx.get('database');

  const condition =
    seasons && seasons.length > 0
      ? inArray(calendarsSchema.season, seasons)
      : eq(calendarsSchema.is_active, true);

  return database
    .select({
      calendar: calendarsSchema,
      relation: calendarRelationsSchema,
      subject: subjectsSchema
    })
    .from(calendarsSchema)
    .leftJoin(calendarRelationsSchema, eq(calendarRelationsSchema.season, calendarsSchema.season))
    .leftJoin(subjectsSchema, eq(calendarRelationsSchema.subject_id, subjectsSchema.id))
    .where(condition)
    .orderBy(asc(calendarsSchema.season), asc(calendarRelationsSchema.id));
}

export async function fetchCalendars(ctx: Context): Promise<Calendar[]> {
  const database = ctx.get('database');

  return database.select().from(calendarsSchema).orderBy(asc(calendarsSchema.season));
}

export async function upsertCalendar(
  ctx: Context,
  input: CalendarUpdateInput
): Promise<{ ok: true; data: CalendarUpdateResult } | { ok: false; error: Error }> {
  try {
    const database = ctx.get('database');
    const now = new Date();

    if (input.isActive === undefined) {
      await database
        .insert(calendarsSchema)
        .values({ season: input.season, updated_at: now })
        .onConflictDoNothing({ target: calendarsSchema.season });
    } else {
      await database
        .insert(calendarsSchema)
        .values({ season: input.season, is_active: input.isActive, updated_at: now })
        .onConflictDoUpdate({
          target: calendarsSchema.season,
          set: {
            is_active: input.isActive,
            updated_at: now
          }
        });
    }

    if (input.calendar) {
      const existing = await database.query.calendarRelations.findMany({
        where: (table, { eq }) => eq(table.season, input.season),
        orderBy: (table, { asc }) => asc(table.id)
      });
      const calendar = input.calendar.map((item) => ({
        season: input.season,
        subject_id: item.subject_id,
        platform: item.platform,
        weekday: item.weekday ?? null
      }));

      const pending = new Map<string, { count: number; row: (typeof calendar)[number] }>();
      for (const row of calendar) {
        const key = getCalendarRelationKey(row);
        const item = pending.get(key);
        if (item) {
          item.count += 1;
        } else {
          pending.set(key, { count: 1, row });
        }
      }

      const deleteIds: number[] = [];
      for (const row of existing) {
        const key = getCalendarRelationKey(row);
        const item = pending.get(key);
        if (item && item.count > 0) {
          item.count -= 1;
        } else {
          deleteIds.push(row.id);
        }
      }

      const insertCalendar = [...pending.values()].flatMap(({ count, row }) =>
        Array.from({ length: count }, () => row)
      );

      const batchSize = 20;
      const statements: BatchItem<'sqlite'>[] = [];
      for (let i = 0; i < deleteIds.length; i += batchSize) {
        statements.push(
          database
            .delete(calendarRelationsSchema)
            .where(inArray(calendarRelationsSchema.id, deleteIds.slice(i, i + batchSize)))
        );
      }
      for (let i = 0; i < insertCalendar.length; i += batchSize) {
        statements.push(
          database.insert(calendarRelationsSchema).values(insertCalendar.slice(i, i + batchSize))
        );
      }

      if (hasBatchItems(statements)) {
        await database.batch(statements);
      }

      if (input.isActive === undefined) {
        await database
          .update(calendarsSchema)
          .set({ updated_at: now })
          .where(eq(calendarsSchema.season, input.season));
      }
    }

    const [calendarRow, relations] = await database.batch([
      database.query.calendars.findFirst({
        where: (table, { eq }) => eq(table.season, input.season)
      }),
      database.query.calendarRelations.findMany({
        where: (table, { eq }) => eq(table.season, input.season),
        orderBy: (table, { asc }) => asc(table.id)
      })
    ]);

    if (!calendarRow) {
      return {
        ok: false,
        error: new Error('calendar not found')
      };
    }

    return {
      ok: true,
      data: {
        season: calendarRow.season,
        is_active: calendarRow.is_active,
        updated_at: calendarRow.updated_at,
        calendar: relations.map((item): CalendarInput => {
          return {
            subject_id: item.subject_id,
            platform: item.platform,
            weekday: item.weekday
          };
        })
      }
    };
  } catch (error) {
    console.error('[bgmw]', 'failed to update calendar', error);

    return {
      ok: false,
      error: error as Error
    };
  }
}

export async function deleteCalendar(ctx: Context, season: string) {
  const database = ctx.get('database');

  await database.delete(calendarRelationsSchema).where(eq(calendarRelationsSchema.season, season));
  await database.delete(calendarsSchema).where(eq(calendarsSchema.season, season));
}

function getCalendarRelationKey(row: {
  subject_id: number;
  platform: 'tv' | 'web';
  weekday: number | null;
}) {
  return `${row.subject_id}:${row.platform}:${row.weekday ?? ''}`;
}

function hasBatchItems<T>(items: T[]): items is [T, ...T[]] {
  return items.length > 0;
}
