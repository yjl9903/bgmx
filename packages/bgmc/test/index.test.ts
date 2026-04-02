import { afterEach, describe, expect, it, vi } from 'vitest';

import { BgmClient } from '../src';

describe('BgmClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts subject search requests as JSON with authorization', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ total: 0, data: [] }), {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    const client = new BgmClient({
      accessToken: 'token',
      fetch,
      userAgent: 'bgmc-test'
    });

    await client.searchSubjects({
      query: {
        limit: 10,
        offset: 20
      },
      requestBody: {
        keyword: '孤独摇滚'
      }
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.bgm.tv/v0/search/subjects?limit=10&offset=20',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          keyword: '孤独摇滚'
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'User-Agent': 'bgmc-test'
        })
      })
    );
  });

  it('requests images with manual redirects and returns location headers', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: 'https://lain.bgm.tv/pic/cover/l/xx/example.jpg'
        }
      })
    );

    const client = new BgmClient({
      fetch
    });

    const result = await client.subjectImage(42, { type: 'large' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.bgm.tv/v0/subjects/42/image?type=large',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual'
      })
    );
    expect(result.headers.Location).toBe('https://lain.bgm.tv/pic/cover/l/xx/example.jpg');
  });

  it('encodes legacy search keywords in path segments', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ results: 0, list: [] }), {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    const client = new BgmClient({
      fetch
    });

    await client.search('foo/bar', {
      max_results: 5,
      responseGroup: 'small'
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.bgm.tv/search/subject/foo%2Fbar?max_results=5&responseGroup=small',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });
});
