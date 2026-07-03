import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { subjects } from './subject';

export const calendars = sqliteTable('calendars', {
  season: text('season').primaryKey(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false)
});

export const calendarRelations = sqliteTable('calendar_relations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  season: text('season')
    .notNull()
    .references(() => calendars.season),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
  platform: text('platform').$type<'tv' | 'web'>().notNull(),
  weekday: integer('weekday')
});
