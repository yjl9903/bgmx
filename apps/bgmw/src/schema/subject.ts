import { sqliteTable, index, integer, text } from 'drizzle-orm/sqlite-core';

import type { RelatedSubject, SubjectCharacters, SubjectInformation, SubjectPersons } from 'bgmc';

import type { SubjectAlias, SubjectBangumiData, SubjectSearch, SubjectTmdbData } from './types';

export const bangumis = sqliteTable('bangumis', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<SubjectInformation>().notNull(),
  persons: text('persons', { mode: 'json' }).$type<SubjectPersons>().notNull(),
  characters: text('characters', { mode: 'json' }).$type<SubjectCharacters>().notNull(),
  subjects: text('subjects', { mode: 'json' }).$type<RelatedSubject[]>().notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const tmdbs = sqliteTable('tmdbs', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const subjects = sqliteTable('subjects', {
  id: integer('id')
    .primaryKey()
    .references(() => bangumis.id),
  title: text('title').notNull(),
  bangumi: text('bangumi', { mode: 'json' }).$type<SubjectBangumiData>().notNull(),
  tmdb: text('tmdb', { mode: 'json' }).$type<SubjectTmdbData | null>(),
  poster: text('poster').notNull(),
  onair_date: text('onair_date'),
  alias: text('alias', { mode: 'json' }).$type<SubjectAlias>().notNull(),
  search: text('search', { mode: 'json' }).$type<SubjectSearch>().notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const subjectSearchTitles = sqliteTable(
  'subject_search_titles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject_id: integer('subject_id')
      .notNull()
      .references(() => subjects.id),
    title: text('title').notNull(),
    normalized_title: text('normalized_title').notNull()
  },
  (table) => [
    index('subject_search_titles_subject_normalized_title_idx').on(
      table.subject_id,
      table.normalized_title
    ),
    index('subject_search_titles_subject_id_idx').on(table.subject_id)
  ]
);
