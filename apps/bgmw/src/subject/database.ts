import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';

import type { Context } from '../env';
import type { Database } from '../database';
import type {
  Bangumi as DatabaseBangumi,
  Revision as DatabaseRevision,
  RevisionDetail,
  Subject as DatabaseSubject
} from '../schema/types';

import { decodeSubjectTitle, normalizeTitle } from 'bgmt';

import {
  bangumis as bangumisSchema,
  calendarRelations as calendarRelationsSchema,
  revisions as revisionsSchema,
  subjectSearchTitles as subjectSearchTitlesSchema,
  subjects as subjectsSchema,
  tmdbs as tmdbsSchema
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
    where: (table, { and, eq }) => and(eq(table.target_id, subjectId)),
    orderBy: (table, { asc }) => asc(table.id)
  });
}

export async function fetchSubjectRevisions(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  return database.query.revisions.findMany({
    where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.target_id, subjectId)),
    orderBy: (table, { asc }) => asc(table.id)
  });
}

export async function fetchSubjectRevision(ctx: Context, subjectId: number, revisionId: number) {
  const database = ctx.get('database');

  return database.query.revisions.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.enabled, true), eq(table.id, revisionId), eq(table.target_id, subjectId))
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
        target_id: subjectId,
        enabled: true,
        detail
      })
      .returning(),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.target_id, subjectId)),
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
      .where(and(eq(revisionsSchema.id, revisionId), eq(revisionsSchema.target_id, subjectId))),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.target_id, subjectId)),
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
      .where(and(eq(revisionsSchema.id, revisionId), eq(revisionsSchema.target_id, subjectId))),
    database.query.revisions.findMany({
      where: (table, { and, eq }) => and(eq(table.enabled, true), eq(table.target_id, subjectId)),
      orderBy: (table, { asc }) => asc(table.id)
    })
  ]);

  console.log('[bgmw]', 'disable subject revision', subjectId, revisionId, revisions);

  return revisions;
}

export async function deleteSubjectData(ctx: Context, subjectId: number) {
  const database = ctx.get('database');

  await database.batch([
    database
      .delete(calendarRelationsSchema)
      .where(eq(calendarRelationsSchema.subject_id, subjectId)),
    database
      .delete(subjectSearchTitlesSchema)
      .where(eq(subjectSearchTitlesSchema.subject_id, subjectId)),
    database.delete(revisionsSchema).where(eq(revisionsSchema.target_id, subjectId)),
    database.delete(subjectsSchema).where(eq(subjectsSchema.id, subjectId)),
    database.delete(tmdbsSchema).where(eq(tmdbsSchema.id, subjectId)),
    database.delete(bangumisSchema).where(eq(bangumisSchema.id, subjectId))
  ]);
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

export async function fetchSubjectsBySearchTitle(
  ctx: Context,
  query: string,
  cursor: number,
  limit: number
) {
  const database = ctx.get('database');
  const normalizedQuery = normalizeTitle(decodeSubjectTitle(query));

  if (!normalizedQuery) return [];

  return database
    .select()
    .from(subjectsSchema)
    .where(
      and(
        gt(subjectsSchema.id, cursor),
        sql`exists (
          select 1
          from ${subjectSearchTitlesSchema}
          where ${subjectSearchTitlesSchema.subject_id} = ${subjectsSchema.id}
            and instr(${subjectSearchTitlesSchema.normalized_title}, ${normalizedQuery}) > 0
        )`
      )
    )
    .orderBy(asc(subjectsSchema.id))
    .limit(limit);
}

async function refreshSubjectSearchTitles(
  database: Database,
  subject: Pick<DatabaseSubject, 'id' | 'search'>
) {
  const next = new Map<string, string>();
  for (const title of subject.search.include) {
    const normalized_title = normalizeTitle(decodeSubjectTitle(title));
    if (normalized_title && !next.has(normalized_title)) {
      next.set(normalized_title, title);
    }
  }

  const prev = await database
    .select({
      id: subjectSearchTitlesSchema.id,
      title: subjectSearchTitlesSchema.title,
      normalized_title: subjectSearchTitlesSchema.normalized_title
    })
    .from(subjectSearchTitlesSchema)
    .where(eq(subjectSearchTitlesSchema.subject_id, subject.id));

  const prevByTitle = new Map(prev.map((row) => [row.normalized_title, row]));
  const deleteIds = prev.filter((row) => !next.has(row.normalized_title)).map((row) => row.id);
  const insertRows = [...next]
    .filter(([normalized_title]) => !prevByTitle.has(normalized_title))
    .map(([normalized_title, title]) => ({ subject_id: subject.id, title, normalized_title }));
  const updateRows = [...next]
    .map(([normalized_title, title]) => ({ title, row: prevByTitle.get(normalized_title) }))
    .filter((item): item is { title: string; row: NonNullable<typeof item.row> } =>
      Boolean(item.row && item.row.title !== item.title)
    );

  const statements = [
    ...(deleteIds.length > 0
      ? [
          database
            .delete(subjectSearchTitlesSchema)
            .where(inArray(subjectSearchTitlesSchema.id, deleteIds))
        ]
      : []),
    ...updateRows.map(({ title, row }) =>
      database
        .update(subjectSearchTitlesSchema)
        .set({ title })
        .where(eq(subjectSearchTitlesSchema.id, row.id))
    ),
    ...(insertRows.length > 0
      ? [database.insert(subjectSearchTitlesSchema).values(insertRows)]
      : [])
  ];

  if (statements.length > 0) {
    await database.batch(
      statements as [(typeof statements)[number], ...Array<(typeof statements)[number]>]
    );
  }
}

export async function updateSubject(
  ctx: Context,
  bangumi: DatabaseBangumi,
  revisions: DatabaseRevision[]
) {
  const database = ctx.get('database');

  const subject = await createDatabaseSubject(bangumi, revisions);

  const dbSubject = await database.query.subjects
    .findFirst({
      where: (t) => eq(t.id, bangumi.id)
    })
    .catch(() => undefined);

  if (dbSubject) {
    // 使用深度比较检查是否需要更新
    const dirty =
      dbSubject.title !== subject.title ||
      dbSubject.poster !== subject.poster ||
      dbSubject.onair_date !== subject.onair_date ||
      !deepEqual(dbSubject.alias, subject.alias) ||
      !deepEqual(dbSubject.search, subject.search) ||
      !deepEqual(dbSubject.bangumi, subject.bangumi) ||
      !deepEqual(dbSubject.tmdb, subject.tmdb);

    if (dirty) {
      const resp = await database
        .update(subjectsSchema)
        .set({
          title: subject.title,
          bangumi: subject.bangumi,
          tmdb: subject.tmdb,
          poster: subject.poster,
          onair_date: subject.onair_date,
          alias: subject.alias,
          search: subject.search,
          updated_at: subject.updated_at
        })
        .where(eq(subjectsSchema.id, bangumi.id))
        .returning({ id: subjectsSchema.id });

      await refreshSubjectSearchTitles(database, subject);

      return {
        ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
        data: subject
      };
    } else {
      await refreshSubjectSearchTitles(database, dbSubject);

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
          bangumi: subject.bangumi,
          tmdb: subject.tmdb,
          poster: subject.poster,
          onair_date: subject.onair_date,
          alias: subject.alias,
          search: subject.search,
          updated_at: subject.updated_at
        }
      })
      .returning({ id: subjectsSchema.id });

    await refreshSubjectSearchTitles(database, subject);

    return {
      ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
      data: subject
    };
  }
}
