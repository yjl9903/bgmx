import type {
  DatabaseBangumi,
  DatabaseRevision,
  DatabaseSubject,
  CalendarResult,
  CalendarSubject,
  CalendarSummary,
  CalendarUpdateResult
} from './types';

function deserializeDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export function deserializeBangumi(bangumi: DatabaseBangumi): DatabaseBangumi {
  return {
    ...bangumi,
    updated_at: deserializeDate(bangumi.updated_at)
  };
}

export function deserializeSubject(subject: DatabaseSubject): DatabaseSubject {
  return {
    ...subject,
    updated_at: deserializeDate(subject.updated_at)
  };
}

export function deserializeRevision(revision: DatabaseRevision): DatabaseRevision {
  return {
    ...revision,
    created_at: deserializeDate(revision.created_at)
  };
}

export function deserializeRevisionResponse<
  T extends { subject: DatabaseSubject; revisions: DatabaseRevision[] }
>(data: T): T {
  return {
    ...data,
    subject: deserializeSubject(data.subject),
    revisions: data.revisions.map(deserializeRevision)
  };
}

export function deserializeCalendarSubject(subject: CalendarSubject): CalendarSubject {
  return {
    ...subject,
    updated_at: deserializeDate(subject.updated_at)
  };
}

export function deserializeCalendarSummary(calendar: CalendarSummary): CalendarSummary {
  return {
    ...calendar,
    updated_at: deserializeDate(calendar.updated_at)
  };
}

export function deserializeCalendarResult(calendar: CalendarResult): CalendarResult {
  return {
    ...calendar,
    updated_at: calendar.updated_at === null ? null : deserializeDate(calendar.updated_at),
    calendar: calendar.calendar.map((subjects) => subjects.map(deserializeCalendarSubject)),
    web: calendar.web.map(deserializeCalendarSubject),
    korean: calendar.korean.map(deserializeCalendarSubject),
    short: calendar.short.map(deserializeCalendarSubject),
    motion: calendar.motion.map(deserializeCalendarSubject),
    adult: calendar.adult.map(deserializeCalendarSubject)
  };
}

export function deserializeCalendarUpdateResult(
  calendar: CalendarUpdateResult
): CalendarUpdateResult {
  return {
    ...calendar,
    updated_at: deserializeDate(calendar.updated_at)
  };
}
