import type { BasicSubject, FullSubject } from '../types';

export interface CdnOptions {
  /**
   * bgmd version
   *
   * @default '0'
   */
  version?: string;

  /**
   * cdn base URL
   *
   * @default 'https://unpkg.com'
   */
  baseURL?: string;
}

export async function fetchBasicSubjects(): Promise<BasicSubject[]> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/dist/index.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd index.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.bangumis;
}

export async function fetchFullSubjects(): Promise<FullSubject[]> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/dist/full.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd full.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.bangumis;
}

export async function fetchCalendarSubjects(): Promise<{
  calendar: [
    BasicSubject[],
    BasicSubject[],
    BasicSubject[],
    BasicSubject[],
    BasicSubject[],
    BasicSubject[],
    BasicSubject[]
  ];
  web: BasicSubject[];
}> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/dist/calendar.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd calendar.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.calendar;
}
