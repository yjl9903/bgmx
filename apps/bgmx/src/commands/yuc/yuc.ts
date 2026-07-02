import fs from 'fs-extra';
import path from 'path';
import { parse, stringify } from 'yaml';

import { fetchYucPage } from './fetch';
import { YucCalendarItem, YucItem } from './types';

export interface FetchYucDataOptions {
  /**
   * 年份
   */
  year?: number;

  /**
   * 月份
   */
  month?: number;

  /**
   * 会话记录文件
   */
  session?: string;

  /**
   * 强制更新数据
   */
  force?: boolean;
}

export async function fetchYucData(options: FetchYucDataOptions) {
  const [year, month] =
    options.year && options.month
      ? [options.year, options.month]
      : options.session && !options.year && !options.month
        ? inferOnairMonthFromSession(options.session)
        : inferOnairMonth();

  const sessionFile = options.session ?? `yuc-${year}-${('' + month).padStart(2, '0')}.yaml`;

  const session = options.force ? undefined : await readSession(sessionFile);
  const { items, calendar, web } = session ?? (await fetchYucPage(year, month));

  let valid = true;
  for (const item of items) {
    if (item.id === -1) {
      valid = false;
      break;
    }
  }
  for (const row of calendar) {
    for (const item of row) {
      if (item.id === -1) {
        valid = false;
        break;
      }
    }
  }
  for (const item of web) {
    if (item.id === -1) {
      valid = false;
      break;
    }
  }

  return { session: sessionFile, year, month, items, calendar, web, valid };
}

export async function readSession(file: string): Promise<
  | {
      year: number;
      month: number;
      items: YucItem[];
      calendar: YucCalendarItem[][];
      web: YucCalendarItem[];
    }
  | undefined
> {
  try {
    if (await fs.exists(file)) {
      const content = await fs.readFile(file, 'utf-8');
      const data = parse(content);
      return data;
    }
    return undefined;
  } catch (error) {
    console.error('Failed to read session file', file, error);
    return undefined;
  }
}

export async function writeSession(
  file: string,
  data: {
    year: number;
    month: number;
    items: YucItem[];
    calendar: YucCalendarItem[][];
    web: YucCalendarItem[];
  }
) {
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(
    file,
    stringify({
      year: data.year,
      month: data.month,
      items: data.items,
      calendar: data.calendar,
      web: data.web
    }),
    'utf-8'
  );
}

function inferOnairMonthFromSession(file: string) {
  const match = path.basename(file).match(/(\d{4})-?(\d{2})/);
  if (!match) {
    throw new Error(`Cannot infer yuc year and month from session file: ${file}`);
  }
  return [+match[1], +match[2]];
}

function inferOnairMonth() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  switch (month) {
    case 1:
    case 2:
      return [year, 1];
    case 3:
    case 4:
    case 5:
      return [year, 4];
    case 6:
    case 7:
    case 8:
      return [year, 7];
    case 9:
    case 10:
    case 11:
      return [year, 10];
    case 12:
      return [year + 1, 1];
    default:
      throw new Error('unreachable');
  }
}
