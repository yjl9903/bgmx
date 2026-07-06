import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { subjects } from './subject';

export const calendars = sqliteTable('calendars', {
  season: text('season').primaryKey(),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const calendarRelations = sqliteTable('calendar_relations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  season: text('season')
    .notNull()
    .references(() => calendars.season),
  subject_id: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
  platform: text('platform').$type<'tv' | 'web'>().notNull(),
  weekday: integer('weekday')
});
