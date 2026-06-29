import { and, asc, eq, gt } from 'drizzle-orm';

import type { Context } from '../env';
import {
  type Bangumi as DatabaseBangumi,
  type Revision as DatabaseRevision,
  type RevisionDetail,
  revisions as revisionsSchema,
  subjects as subjectsSchema
} from '../schema';

import { deepEqual } from './utils';
import { createDatabaseSubject } from './subject';

export async function fetchSubjectById(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  return database.query.subjects.findFirst({
    where: (table, { eq }) => eq(table.id, subjectId)
  });
}

export async function fetchBangumiById(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  return database.query.bangumis.findFirst({
    where: (table, { eq }) => eq(table.id, subjectId)
  });
}

export async function fetchSubjectAllRevisions(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  return database.query.revisions.findMany({
    where: (table, { and, eq }) => and(eq(table.targetId, subjectId)),
    orderBy: (table, { asc }) => asc(table.id)
  });
}

export async function fetchSubjectRevisions(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  return database.query.revisions.findMany({
    where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.targetId, subjectId)),
    orderBy: (table, { asc }) => asc(table.id)
  });
}

export async function fetchSubjectRevision(ctx: Context, subjectId: number, revisionId: number) {
  const database = ctx.get('database');

  return database.query.revisions.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.enabled, true), eq(table.id, revisionId), eq(table.targetId, subjectId))
  });
}

export async function createSubjectRevision(
  ctx: Context,
  subjectId: number,
  detail: RevisionDetail
) {
  const database = ctx.get('database');

  const [[created], revisions] = await database.batch([
    database
      .insert(revisionsSchema)
      .values({
        targetId: subjectId,
        enabled: true,
        detail
      })
      .returning(),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.targetId, subjectId)),
      orderBy: (table, { asc }) => asc(table.id)
    })
  ]);

  console.log('[bgmw]', 'create subject revision', subjectId, created, revisions);

  return revisions;
}

export async function enableSubjectRevision(ctx: Context, subjectId: number, revisionId: number) {
  const database = ctx.get('database');

  const [, revisions] = await database.batch([
    database
      .update(revisionsSchema)
      .set({ enabled: true })
      .where(and(eq(revisionsSchema.id, revisionId), eq(revisionsSchema.targetId, subjectId))),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.targetId, subjectId)),
      orderBy: (table, { asc }) => asc(table.id)
    })
  ]);

  console.log('[bgmw]', 'enable subject revision', subjectId, revisionId, revisions);

  return revisions;
}

export async function disableSubjectRevision(ctx: Context, subjectId: number, revisionId: number) {
  const database = ctx.get('database');

  const [, revisions] = await database.batch([
    database
      .update(revisionsSchema)
      .set({ enabled: false })
      .where(and(eq(revisionsSchema.id, revisionId), eq(revisionsSchema.targetId, subjectId))),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.targetId, subjectId)),
      orderBy: (table, { asc }) => asc(table.id)
    })
  ]);

  console.log('[bgmw]', 'disable subject revision', subjectId, revisionId, revisions);

  return revisions;
}

export async function fetchSubjectsAfterCursor(ctx: Context, cursor: number, limit: number) {
  const database = ctx.get('database');

  return database
    .select()
    .from(subjectsSchema)
    .where(gt(subjectsSchema.id, cursor))
    .orderBy(asc(subjectsSchema.id))
    .limit(limit);
}

export async function updateSubject(
  ctx: Context,
  bangumi: DatabaseBangumi,
  revisions: DatabaseRevision[]
) {
  const database = ctx.get('database');

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
