import { describe, expect, it, vi } from 'vitest';

import { fetchAndUpdateBangumiSubject, fetchBangumiSubjects } from '../src/client';

const UpdatedAt = '2026-08-22T08:00:00.000Z';

describe('bangumi client', () => {
  it('deserializes updated_at when updating a subject', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { id: 1, updated_at: UpdatedAt } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const subject = await fetchAndUpdateBangumiSubject(1, {
      baseURL: 'https://example.test',
      fetch
    });

    expect(subject.updated_at).toEqual(new Date(UpdatedAt));
  });

  it('deserializes updated_at in the subject iterator', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, data: [{ id: 1, updated_at: UpdatedAt }], next_cursor: null }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
    const subjects = [];

    for await (const subject of fetchBangumiSubjects({
      baseURL: 'https://example.test',
      fetch
    })) {
      subjects.push(subject);
    }

    expect(subjects[0]?.updated_at).toEqual(new Date(UpdatedAt));
  });
});
