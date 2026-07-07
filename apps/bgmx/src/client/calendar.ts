import type {
  CalendarResult,
  CalendarSummary,
  CalendarUpdateInput,
  CalendarUpdateResult,
  FetchOptions
} from './types';

import { fetchAPI } from './base';

export type FetchCalendarOptions = FetchOptions & {
  seasons?: string[];
};

export async function fetchCalendars(options: FetchOptions = {}): Promise<CalendarSummary[]> {
  const resp = await fetchAPI<any>('/calendars', { method: 'GET' }, options);
  if (resp.ok) {
    return resp.data as CalendarSummary[];
  }
  throw new Error(`Fetch calendars failed`, { cause: resp });
}

export async function fetchCalendar(options: FetchCalendarOptions = {}) {
  const search = new URLSearchParams();
  for (const season of options.seasons ?? []) {
    search.append('season', season);
  }

  const path = search.size > 0 ? `/calendar?${search.toString()}` : '/calendar';
  const resp = await fetchAPI<any>(path, { method: 'GET' }, options);
  if (resp.ok) {
    return resp.data as CalendarResult;
  }
  throw new Error(`Fetch calendar failed`, { cause: resp });
}

export async function updateCalendar(
  input: CalendarUpdateInput,
  options: FetchOptions = {}
): Promise<CalendarUpdateResult> {
  const body: {
    season: string;
    is_active?: boolean;
    calendar?: CalendarUpdateInput['calendar'];
  } = {
    season: input.season
  };

  if (input.isActive !== undefined) {
    body.is_active = input.isActive;
  }
  if (input.calendar !== undefined) {
    body.calendar = input.calendar;
  }

  const resp = await fetchAPI<any>(
    `/calendar`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    },
    options
  );
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Update calendar failed`, { cause: resp });
}

export async function deleteCalendar(season: string, options: FetchOptions = {}) {
  const search = new URLSearchParams({ season });
  const resp = await fetchAPI<any>(`/calendar?${search.toString()}`, { method: 'DELETE' }, options);
  if (resp.ok) {
    return resp.data as { season: string };
  }
  throw new Error(`Delete calendar failed`, { cause: resp });
}
