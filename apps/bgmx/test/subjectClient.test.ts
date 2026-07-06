import { describe, expect, it, vi } from 'vitest';

import { deleteSubject, refreshSubject } from '../src/client';

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
});
