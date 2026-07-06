import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import type { RevisionDetail } from './types';

export const revisions = sqliteTable('revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  target_id: integer('target_id').notNull(),
  detail: text('detail', { mode: 'json' }).$type<RevisionDetail>().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});
