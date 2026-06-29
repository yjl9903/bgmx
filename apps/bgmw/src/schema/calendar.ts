import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { subjects, type Subject } from './subject';

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

export type Calendar = typeof calendars.$inferSelect;

export type CalendarRelation = typeof calendarRelations.$inferSelect;

export type CalendarInput = {
  subject_id: number;
  platform: 'tv' | 'web';
  weekday?: number | null;
};

export type CalendarUpdateInput = {
  season: string;
  isActive?: boolean;
  calendar?: CalendarInput[];
};

export type CalendarUpdateResult = {
  season: string;
  is_active: boolean;
  calendar: CalendarInput[];
};

export type CalendarSubject = Subject & {
  platform: 'tv' | 'web';
  weekday: number | undefined | null;
};
