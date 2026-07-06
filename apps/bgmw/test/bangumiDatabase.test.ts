import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/bangumi/client', () => ({
  client: {
    subject: vi.fn(),
    subjectPersons: vi.fn(),
    subjectCharacters: vi.fn(),
    subjectRelated: vi.fn()
  }
}));

import { client } from '../src/bangumi/client';
import { fetchAndUpdateBangumiSubject, updateDatabaseBangumi } from '../src/bangumi/database';

describe('bangumi database updates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not update database when the subject cannot be fetched', async () => {
    vi.mocked(client.subject).mockRejectedValueOnce(new Error('not found'));
    const ctx = { get: vi.fn() };

    const resp = await fetchAndUpdateBangumiSubject(ctx as any, 1);

    expect(resp.ok).toBe(false);
    expect(client.subjectPersons).not.toHaveBeenCalled();
    expect(ctx.get).not.toHaveBeenCalled();
  });

  it('fetches non-anime details but rejects the database write', async () => {
    vi.mocked(client.subject).mockResolvedValueOnce({ id: 1, type: 1 } as any);
    vi.mocked(client.subjectPersons).mockResolvedValueOnce([]);
    vi.mocked(client.subjectCharacters).mockResolvedValueOnce([]);
    vi.mocked(client.subjectRelated).mockResolvedValueOnce([]);
    const ctx = { get: vi.fn() };

    const resp = await fetchAndUpdateBangumiSubject(ctx as any, 1);

    expect(resp).toEqual({ ok: false, error: 'Bangumi subject is not anime' });
    expect(client.subjectPersons).toHaveBeenCalledWith(1);
    expect(client.subjectCharacters).toHaveBeenCalledWith(1);
    expect(client.subjectRelated).toHaveBeenCalledWith(1);
    expect(ctx.get).not.toHaveBeenCalled();
  });

  it('does not insert non-anime payloads', async () => {
    const ctx = { get: vi.fn() };

    const resp = await updateDatabaseBangumi(ctx as any, 1, {
      data: { id: 1, type: 1 } as any,
      persons: [],
      characters: [],
      subjects: []
    });

    expect(resp).toEqual({ ok: false, error: 'Bangumi subject is not anime' });
    expect(ctx.get).not.toHaveBeenCalled();
  });
});
