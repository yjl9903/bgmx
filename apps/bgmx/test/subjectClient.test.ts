import { describe, expect, it, vi } from 'vitest';

import { deleteSubject, fetchSubjects, refreshSubject } from '../src/client';

describe('subject client', () => {
  it('refreshes subject through subject endpoint', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(refreshSubject(1, { baseURL: 'https://example.test', secret: 'secret', fetch }))
      .resolves.toEqual({ id: 1 });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.test/subject/1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers)
      })
    );
    expect((fetch.mock.calls[0]?.[1]?.headers as Headers).get('Authorization')).toBe(
      'Bearer secret'
    );
  });

  it('deletes subject through subject endpoint', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(deleteSubject(1, { baseURL: 'https://example.test', fetch })).resolves.toEqual({
      id: 1
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.test/subject/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('splits subject list requests above server limit', async () => {
    const page = (start: number, count: number) =>
      Array.from({ length: count }, (_, index) => ({ id: start + index }));
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: page(1, 1000), next_cursor: 1000 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: page(1001, 1000), next_cursor: 2000 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: page(2001, 500), next_cursor: 2500 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const subjects = [];
    for await (const subject of fetchSubjects({
      baseURL: 'https://example.test',
      fetch,
      limit: 2500
    })) {
      subjects.push(subject);
    }

    expect(subjects).toHaveLength(2500);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://example.test/subjects?cursor=0&limit=1000',
      'https://example.test/subjects?cursor=1000&limit=1000',
      'https://example.test/subjects?cursor=2000&limit=500'
    ]);
  });
});
