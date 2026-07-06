import type { FetchOptions, DatabaseSubject, RevisionDetail, DatabaseRevision } from './types';

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

export async function* fetchSubjects(
  options: FetchOptions & { q?: string } = {}
): AsyncGenerator<DatabaseSubject> {
  let cursor = 0;
  while (true) {
    const params = new URLSearchParams({ cursor: String(cursor) });
    if (options.q) params.set('q', options.q);

    const resp = await fetchAPI<any>(`/subjects?${params}`, {}, options);

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
