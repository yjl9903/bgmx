import type { Calendar, SubjectInformation } from 'bgmc';

import type { FetchOptions, DatabaseBangumi } from './types';

import { fetchAPI } from './base';

export async function fetchBangumiCalendar(options: FetchOptions = {}): Promise<Calendar> {
  const resp = await fetchAPI<any>('/bangumi/calendar', {}, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch bangumi calendar failed`, { cause: resp });
}

export async function fetchBangumiSubject(
  bgmId: number,
  options: FetchOptions
): Promise<SubjectInformation> {
  const resp = await fetchAPI<any>(`/bangumi/subject/${bgmId}`, {}, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch bangumi subject failed`, { cause: resp });
}

export async function* fetchBangumiSubjects(
  options: FetchOptions = {}
): AsyncGenerator<DatabaseBangumi> {
  let cursor = 0;
  while (true) {
    const resp = await fetchAPI<any>(`/bangumi/subjects?cursor=${cursor}`, {}, options);

    if (resp.ok) {
      for (const subject of resp.data) {
        yield subject;
      }

      cursor = resp.next_cursor;
      if (!cursor) {
        break;
      }
    } else {
      throw new Error(`Fetch bangumi subjects failed`, { cause: resp });
    }
  }
}

export async function fetchAndUpdateBangumiSubject(
  bgmId: number,
  options: FetchOptions = {}
): Promise<DatabaseBangumi> {
  const resp = await fetchAPI<any>(`/bangumi/subject/${bgmId}`, { method: 'POST' }, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch bangumi subject failed`, { cause: resp });
}
