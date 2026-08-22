import { describe, expect, it, vi } from 'vitest';

import {
  deleteRevision,
  deleteSubject,
  disableRevision,
  enableRevision,
  fetchRevisions,
  fetchSubjects,
  refreshSubject
} from '../src/client';

const UpdatedAt = '2026-08-22T08:00:00.000Z';

function serializedSubject(id = 1) {
  return { id, updated_at: UpdatedAt };
}

function deserializedSubject(id = 1) {
  return { id, updated_at: new Date(UpdatedAt) };
}

describe('subject client', () => {
  it('refreshes subject through subject endpoint', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: serializedSubject() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(refreshSubject(1, { baseURL: 'https://example.test', secret: 'secret', fetch }))
      .resolves.toEqual(deserializedSubject());

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

  it('fetches all subject revisions through the revision list endpoint', async () => {
    const data = {
      subject: serializedSubject(),
      revisions: [{ id: 2, enabled: false, created_at: UpdatedAt }]
    };
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await fetchRevisions(1, { baseURL: 'https://example.test', fetch });

    expect(result).toEqual({
      ...data,
      subject: deserializedSubject(),
      revisions: [
        {
          ...data.revisions[0],
          created_at: new Date(UpdatedAt)
        }
      ]
    });
    expect(result.revisions[0]?.created_at).toBeInstanceOf(Date);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://example.test/subject/1/revisions');
  });

  it.each([
    ['enables', enableRevision, true],
    ['disables', disableRevision, false]
  ] as const)('%s a revision through patch', async (_label, updateRevision, enabled) => {
    const data = { subject: serializedSubject(), revisions: [] };
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(
      updateRevision(1, 2, { baseURL: 'https://example.test', fetch })
    ).resolves.toEqual({ ...data, subject: deserializedSubject() });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.test/subject/1/revision/2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      })
    );
  });

  it('deletes a revision through delete', async () => {
    const data = { subject: serializedSubject(), revisions: [] };
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(
      deleteRevision(1, 2, { baseURL: 'https://example.test', fetch })
    ).resolves.toEqual({ ...data, subject: deserializedSubject() });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.test/subject/1/revision/2',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('splits subject list requests above server limit', async () => {
    const page = (start: number, count: number) =>
      Array.from({ length: count }, (_, index) => serializedSubject(start + index));
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
    expect(subjects[0]?.updated_at).toBeInstanceOf(Date);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://example.test/subjects?cursor=0&limit=1000',
      'https://example.test/subjects?cursor=1000&limit=1000',
      'https://example.test/subjects?cursor=2000&limit=500'
    ]);
  });
});
