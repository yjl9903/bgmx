import type {
  FetchOptions,
  DatabaseSubject,
  CalendarInput,
  CalendarSubject,
  RevisionDetail,
  DatabaseRevision
} from './types';

import { fetchAPI } from './base';

export async function fetchSubject(
  subjectId: number,
  options?: FetchOptions
): Promise<{ subject: DatabaseSubject; revisions: DatabaseRevision[] }> {
  const resp = await fetchAPI<any>(`/subject/${subjectId}`, {}, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch subject failed`, { cause: resp });
}

export async function fetchRevisions(
  subjectId: number,
  options?: FetchOptions
): Promise<{ subject: DatabaseSubject; revisions: DatabaseRevision[] }> {
  const resp = await fetchAPI<any>(`/subject/${subjectId}/revisions`, {}, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch subject failed`, { cause: resp });
}

export async function createRevision(
  subjectId: number,
  detail: RevisionDetail,
  options?: FetchOptions
): Promise<{ subject: DatabaseSubject; revisions: DatabaseRevision[] }> {
  const resp = await fetchAPI<any>(
    `/subject/${subjectId}/revision`,
    {
      method: 'POST',
      body: JSON.stringify({ detail }),
      headers: { 'Content-Type': 'application/json' }
    },
    options
  );
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Create subject revision failed`, { cause: resp });
}

export async function enableRevision(
  subjectId: number,
  revisionId: number,
  options?: FetchOptions
): Promise<{ subject: DatabaseSubject; revisions: DatabaseRevision[] }> {
  const resp = await fetchAPI<any>(
    `/subject/${subjectId}/revision/${revisionId}`,
    { method: 'PUT' },
    options
  );
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Create subject revision failed`, { cause: resp });
}

export async function disableRevision(
  subjectId: number,
  revisionId: number,
  options?: FetchOptions
): Promise<{ subject: DatabaseSubject; revisions: DatabaseRevision[] }> {
  const resp = await fetchAPI<any>(
    `/subject/${subjectId}/revision/${revisionId}`,
    { method: 'DELETE' },
    options
  );
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Create subject revision failed`, { cause: resp });
}

export async function* fetchSubjects(options: FetchOptions = {}): AsyncGenerator<DatabaseSubject> {
  let cursor = 0;
  while (true) {
    const resp = await fetchAPI<any>(`/subjects?cursor=${cursor}`, {}, options);

    if (resp.ok) {
      for (const subject of resp.data) {
        yield subject;
      }

      cursor = resp.nextCursor;
      if (!cursor) {
        break;
      }
    } else {
      throw new Error(`Fetch subjects failed`, { cause: resp });
    }
  }
}

export async function updateCalendar(
  calendar: CalendarInput[],
  options: FetchOptions = {}
): Promise<CalendarInput[]> {
  const resp = await fetchAPI<any>(
    `/calendar`,
    {
      method: 'POST',
      body: JSON.stringify({ calendar }),
      headers: { 'Content-Type': 'application/json' }
    },
    options
  );
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Update calendar failed`, { cause: resp });
}

export async function fetchCalendar(options: FetchOptions = {}) {
  const resp = await fetchAPI<any>(`/calendar`, { method: 'GET' }, options);
  if (resp.ok) {
    return resp.data as { calendar: CalendarSubject[][]; web: CalendarSubject[] };
  }
  throw new Error(`Fetch calendar failed`, { cause: resp });
}
