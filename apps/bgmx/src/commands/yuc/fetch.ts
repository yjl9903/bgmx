import { createRequire } from 'node:module';

import type { YucItem, YucCalendarItem } from './types';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as typeof import('jsdom');

export async function fetchYucPage(year: number, month: number) {
  const page = `${year}${String(month).padStart(2, '0')}`;
  const url = `https://yuc.wiki/${page}/`;
  const resp = await fetch(url);
  const html = await resp.text();
  const doc = new JSDOM(html);

  const items = extractAnime(doc.window.document);

  const { calendar, web } = extractCalendar(doc.window.document);

  return { items, calendar, web };
}

function extractAnime(doc: Document) {
  const tbodies = Array.from(doc.querySelectorAll('td.title_main_r')).map(
    (t) => t.parentElement!.parentElement!
  );
  const result: YucItem[] = [];
  for (const tbody of tbodies) {
    const container = tbody.parentElement?.parentElement;
    const cover = container?.previousElementSibling
      ?.querySelector('img')
      ?.getAttribute('data-src')
      ?.trim();

    const title_main = tbody.querySelector('tr:first-child td.title_main_r');
    const name_cn = title_main?.children[0]?.textContent?.trim();
    const name_jp = title_main?.children[1]?.textContent?.trim();
    const type = tbody
      .querySelector('tr:first-child td:nth-child(2)')
      ?.innerHTML?.replace(/<br>/g, ' ')
      ?.trim();

    const tags = parseTags(
      tbody.querySelector('tr:nth-child(2) td:first-child')?.textContent?.trim()
    );
    const staff = parseStaff(tbody.querySelector('tr:nth-child(3) td:nth-child(1)')?.innerHTML);
    const cast = parseCast(tbody.querySelector('tr:nth-child(3) td:nth-child(2)')?.innerHTML);
    const website = parseWebsite(
      tbody.querySelector('tr:nth-child(3) td:nth-child(3) a:first-child') as HTMLElement
    );
    const broadcast = parseBroadcast(
      tbody.querySelector('tr:nth-child(3) td:nth-child(3)') as HTMLElement
    );

    if (!name_cn || !name_jp || !type) {
      console.error('unknown yuc item', name_cn, name_jp, type, tbody.innerHTML?.trim());
      continue;
    }

    result.push({
      id: -1,
      name_cn,
      name_jp,
      cover: cover || undefined,
      type,
      tags,
      staff,
      cast,
      website,
      broadcast
    });
  }

  return result;
}

const DAY_MAP = new Map([
  ['周一', 0],
  ['周二', 1],
  ['周三', 2],
  ['周四', 3],
  ['周五', 4],
  ['周六', 5],
  ['周日', 6],
  ['周天', 6]
]);

function extractCalendar(doc: Document) {
  const calendar: YucCalendarItem[][] = [[], [], [], [], [], [], []];
  const web: YucCalendarItem[] = [];

  const wrappers = Array.from(doc.querySelectorAll('td.date2')).map(
    (t) => t.parentElement!.parentElement!.parentElement!.parentElement
  );
  for (const wrapper of wrappers) {
    const day = DAY_MAP.get(wrapper?.querySelector('.date2')?.textContent?.slice(0, 2) ?? '');
    const list = day !== undefined ? calendar[day] : web;

    const root = wrapper?.nextElementSibling;
    for (const dom of root?.children ?? []) {
      const tr = dom.querySelector('table tbody')?.children[0];

      const title = tr?.querySelector('td:first-child')?.textContent?.trim();
      const cover = (
        dom.querySelector('.div_date img') || dom.querySelector('.div_date_ img')
      )?.getAttribute('data-src');

      if (!cover || !title) {
        console.error(`unknown calendar item`, title, cover, dom?.innerHTML?.trim());
        break;
      }

      list.push({ id: -1, name: title, cover });
    }
  }

  return { calendar, web };
}

function parseTags(text?: string) {
  if (!text) return [];
  return text
    .split('/')
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseStaff(text?: string) {
  if (!text) return [];
  const staff: Array<{ name: string; position: string }> = [];
  const lines = text
    .split('<br>')
    .map((t) => decodeName(stripHtmlTags(t.trim())))
    .filter(Boolean);
  let pos = '';
  for (const line of lines) {
    const [key, value] = line.split(/:|：/).map((t) => t.trim());
    if (key && value) {
      pos = key;
      staff.push({ position: key, name: value });
    } else if (key) {
      staff.push({ position: pos, name: key });
    }
  }
  return staff;
}

function parseCast(text?: string) {
  if (!text) return [];
  const lines = text
    .split('<br>')
    .map((t) => decodeName(stripHtmlTags(t.trim())))
    .filter(Boolean)
    .map((t) => t.split('　'))
    .flat()
    .map((t) => t.trim())
    .filter(Boolean);
  return lines.map((t) => ({ name: t }));
}

function parseWebsite(dom?: HTMLElement) {
  if (dom?.textContent?.includes('官网')) {
    return dom.getAttribute('href') || '';
  }
  return '';
}

function parseBroadcast(dom?: HTMLElement) {
  if (!dom) return undefined;
  const b1 = dom.querySelector('p.broadcast_r')?.textContent?.trim();
  // const b2 = dom.querySelector('p.broadcast_ex_r');
  if (b1) {
    const RE_START = /(\d+)\/(\d+)/;
    const RE_DAY = /周[一二三四五六日天]../;
    const start = RE_START.exec(b1);
    if (start) {
      const bstart = { month: +start[1], date: +start[2] };
      const day = RE_DAY.exec(b1);
      if (day) {
        const d1 = day[0].slice(0, 2);
        const d2 = day[0].slice(2, 4);
        return { start: bstart, day: DAY_MAP.get(d1), time: d2 };
      } else {
        return { start: bstart, day: undefined, time: undefined };
      }
    }
  }
  return undefined;
}

function stripHtmlTags(input: string) {
  return input.replace(/^<[^>]+>|<[^>]+>$/g, '');
}

function decodeName(name: string) {
  return name
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
