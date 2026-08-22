import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCalendar, fetchCalendars, updateCalendar } from '../src/client';
import { dumpCalendar } from '../src/commands';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await fs.remove(tempDir);
    tempDir = undefined;
  }
});

describe('calendar client', () => {
  it('defaults new categories when reading an older API response', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            seasons: ['2026-04'],
            updated_at: '2026-08-22T08:00:00.000Z',
            calendar: [[], [], [], [], [], [], []],
            web: [{ id: 1, updated_at: '2026-08-21T08:00:00.000Z' }]
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const data = await fetchCalendar({ baseURL: 'https://example.test', fetch });

    expect(data.korean).toEqual([]);
    expect(data.short).toEqual([]);
    expect(data.motion).toEqual([]);
    expect(data.adult).toEqual([]);
    expect(data.updated_at).toEqual(new Date('2026-08-22T08:00:00.000Z'));
    expect(data.web[0]?.updated_at).toEqual(new Date('2026-08-21T08:00:00.000Z'));
  });

  it('deserializes calendar summary timestamps', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: [
            {
              season: '2026-07',
              is_active: true,
              count: 1,
              updated_at: '2026-08-22T08:00:00.000Z'
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const [calendar] = await fetchCalendars({ baseURL: 'https://example.test', fetch });

    expect(calendar?.updated_at).toEqual(new Date('2026-08-22T08:00:00.000Z'));
  });

  it('uploads category relations with the season calendar', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            season: '2026-07',
            is_active: true,
            updated_at: '2026-08-22T08:00:00.000Z',
            calendar: []
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await updateCalendar(
      {
        season: '2026-07',
        calendar: [{ subject_id: 1, platform: 'motion', weekday: null }]
      },
      { baseURL: 'https://example.test', fetch }
    );

    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      season: '2026-07',
      calendar: [{ subject_id: 1, platform: 'motion', weekday: null }]
    });
    expect(result.updated_at).toEqual(new Date('2026-08-22T08:00:00.000Z'));
  });

  it('writes all categories to calendar JSON', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bgmx-calendar-'));
    const file = path.join(tempDir, 'calendar.json');
    const subject = {
      id: 1,
      title: 'Motion comic',
      alias: {},
      poster: '',
      search: { include: [] },
      bangumi: { platform: 'WEB', images: {}, meta_tags: [], tags: [] },
      updated_at: new Date(),
      platform: 'motion',
      weekday: null
    } as any;

    await dumpCalendar(file, [[], [], [], [], [], [], []], [], {
      categories: { korean: [], short: [], motion: [subject], adult: [] }
    });

    const data = await fs.readJson(file);
    expect(data.korean).toEqual([]);
    expect(data.short).toEqual([]);
    expect(data.motion).toEqual([expect.objectContaining({ id: 1, title: 'Motion comic' })]);
    expect(data.adult).toEqual([]);
  });
});
