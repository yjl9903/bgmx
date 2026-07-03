import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import type { RelatedSubject, SubjectCharacters, SubjectInformation, SubjectPersons } from 'bgmc';

import type { SubjectData, SubjectSearch } from './types';

export const bangumis = sqliteTable('bangumis', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<SubjectInformation>().notNull(),
  persons: text('persons', { mode: 'json' }).$type<SubjectPersons>().notNull(),
  characters: text('characters', { mode: 'json' }).$type<SubjectCharacters>().notNull(),
  subjects: text('subjects', { mode: 'json' }).$type<RelatedSubject[]>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const tmdbs = sqliteTable('tmdbs', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const subjects = sqliteTable('subjects', {
  id: integer('id')
    .primaryKey()
    .references(() => bangumis.id),
  title: text('title').notNull(),
  data: text('data', { mode: 'json' }).$type<SubjectData>().notNull(),
  search: text('search', { mode: 'json' }).$type<SubjectSearch>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});
