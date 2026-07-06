import type {
  FetchOptions,
  DatabaseBangumi,
  DatabaseSubject,
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

export async function refreshSubject(
  subjectId: number,
  options: FetchOptions = {}
): Promise<DatabaseBangumi> {
  const resp = await fetchAPI<any>(`/subject/${subjectId}`, { method: 'POST' }, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Refresh subject failed`, { cause: resp });
}

export async function deleteSubject(
  subjectId: number,
  options: FetchOptions = {}
): Promise<{ id: number }> {
  const resp = await fetchAPI<any>(`/subject/${subjectId}`, { method: 'DELETE' }, options);
  if (resp.ok) {
    return resp.data as { id: number };
  }
  throw new Error(`Delete subject failed`, { cause: resp });
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

const MaxSubjectsLimit = 1000;

export async function* fetchSubjects(
  options: FetchOptions & { q?: string; limit?: number } = {}
): AsyncGenerator<DatabaseSubject> {
  let cursor = 0;
  let count = 0;
  const limit = options.limit ?? Infinity;
  while (true) {
    const requestLimit = Math.min(limit - count, MaxSubjectsLimit);
    if (requestLimit <= 0) {
      break;
    }

    const params = new URLSearchParams({
      cursor: String(cursor),
      limit: String(requestLimit)
    });
    if (options.q) params.set('q', options.q);

    const resp = await fetchAPI<any>(`/subjects?${params}`, {}, options);

    if (resp.ok) {
      for (const subject of resp.data) {
        yield subject;
        count++;
        if (count >= limit) {
          break;
        }
      }

      cursor = resp.next_cursor;
      if (!cursor || count >= limit) {
        break;
      }
    } else {
      throw new Error(`Fetch subjects failed`, { cause: resp });
    }
  }
}
