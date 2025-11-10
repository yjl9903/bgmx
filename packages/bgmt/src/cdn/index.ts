import type { BasicSubject, FullSubject } from '../types';

export * from '../types';

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

export async function fetchBasicSubjects(options: CdnOptions = {}): Promise<BasicSubject[]> {
  const { version = '0', baseURL = 'https://unpkg.com' } = options;
  const resp = await fetch(`${baseURL}/bgmd@${version}/dist/index.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd index.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.bangumis;
}

export async function fetchFullSubjects(options: CdnOptions = {}): Promise<FullSubject[]> {
  const { version = '0', baseURL = 'https://unpkg.com' } = options;
  const resp = await fetch(`${baseURL}/bgmd@${version}/dist/full.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd full.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.bangumis;
}

export async function fetchCalendarSubjects(options: CdnOptions): Promise<{
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
  const { version = '0', baseURL = 'https://unpkg.com' } = options;
  const resp = await fetch(`${baseURL}/bgmd@${version}/dist/calendar.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd calendar.json failed`, { cause: resp });
  }
  const data = (await resp.json()) as any;
  return data.calendar;
}
