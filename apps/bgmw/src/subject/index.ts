import { eq } from 'drizzle-orm';

import type { Context } from '../env';
import {
  type Bangumi as DatabaseBangumi,
  type CalendarInput,
  subjects as subjectsSchema,
  calendars as calendarsSchema
} from '../schema';

import { deepEqual } from './utils';
import { createDatabaseSubject } from './subject';

export async function updateSubject(ctx: Context, bangumi: DatabaseBangumi) {
  const database = ctx.get('database');

  const revisions = await database.query.revisions.findMany({
    where: (t) => eq(t.targetId, bangumi.id)
  });

  const subject = createDatabaseSubject(bangumi, revisions);

  const dbSubject = await database.query.subjects
    .findFirst({
      where: (t) => eq(t.id, bangumi.id)
    })
    .catch(() => undefined);

  if (dbSubject) {
    // 使用深度比较检查是否需要更新
    const dirty =
      dbSubject.title !== subject.title ||
      !deepEqual(dbSubject.search, subject.search) ||
      !deepEqual(dbSubject.data, subject.data);

    if (dirty) {
      const resp = await database
        .update(subjectsSchema)
        .set({
          title: subject.title,
          data: subject.data,
          search: subject.search
        })
        .where(eq(subjectsSchema.id, bangumi.id))
        .returning({ id: subjectsSchema.id });

      return {
        ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
        data: subject
      };
    } else {
      return {
        ok: false,
        data: dbSubject
      };
    }
  } else {
    const resp = await database
      .insert(subjectsSchema)
      .values(subject)
      .onConflictDoUpdate({
        target: subjectsSchema.id,
        set: {
          title: subject.title,
          data: subject.data,
          search: subject.search
        }
      })
      .returning({ id: subjectsSchema.id });

    return {
      ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
      data: subject
    };
  }
}

export async function updateCalendar(ctx: Context, calendarInput: CalendarInput[]) {
  try {
    const database = ctx.get('database');

    await database
      .update(calendarsSchema)
      .set({ isActive: false })
      .where(eq(calendarsSchema.isActive, true));

    // 分块插入
    const batchSize = 20;
    const calendar = calendarInput.map((c) => ({
      id: c.id,
      platform: c.platform,
      weekday: c.weekday,
      isActive: true
    }));

    for (let i = 0; i < calendar.length; i += batchSize) {
      const chunk = calendar.slice(i, i + batchSize);

      await database
        .insert(calendarsSchema)
        .values(chunk)
        .onConflictDoUpdate({
          target: calendarsSchema.id,
          set: {
            isActive: true
          }
        })
        .returning({
          id: calendarsSchema.id,
          platform: calendarsSchema.platform,
          weekday: calendarsSchema.weekday,
          isActive: calendarsSchema.isActive
        });
    }

    const resp = await database
      .select()
      .from(calendarsSchema)
      .where(eq(calendarsSchema.isActive, true))
      .orderBy(calendarsSchema.id);

    calendar.sort((a, b) => a.id - b.id);

    if (resp.length === calendar.length) {
      for (let i = 0; i < resp.length; i++) {
        if (resp[i].id === calendar[i].id) {
          if (
            resp[i].platform !== calendar[i].platform ||
            resp[i].weekday !== calendar[i].weekday
          ) {
            resp[i].platform = calendar[i].platform;
            resp[i].weekday = calendar[i].weekday;

            await database
              .update(calendarsSchema)
              .set({
                platform: calendar[i].platform,
                weekday: calendar[i].weekday
              })
              .where(eq(calendarsSchema.id, resp[i].id));
          }
        }
      }
      return { ok: true, data: resp };
    }

    return {
      ok: false,
      error: new Error('incorrect calendar data')
    };
  } catch (error) {
    console.error('[bgmw]', 'failed to update calendar', error);

    return {
      ok: false,
      error: error as Error
    };
  }
}
