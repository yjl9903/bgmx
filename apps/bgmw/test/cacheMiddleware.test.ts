import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';

import type { AppEnv } from '../src/env';

import { PUBLIC_CACHE_CONTROL, publicCache } from '../src/routes/middlewares/cache';

describe('publicCache middleware', () => {
  it('sets Cache-Control on successful responses', async () => {
    const app = new Hono<AppEnv>();
    app.get('/cached', publicCache(), (c) => c.json({ ok: true }, 200));

    const resp = await app.request('/cached');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe(PUBLIC_CACHE_CONTROL);
  });

  it('does not cache error responses', async () => {
    const app = new Hono<AppEnv>();
    app.get('/missing', publicCache(), (c) => c.json({ ok: false }, 404));

    const resp = await app.request('/missing');

    expect(resp.status).toBe(404);
    expect(resp.headers.get('Cache-Control')).toBeNull();
  });

  it('does not replace an existing Cache-Control header', async () => {
    const app = new Hono<AppEnv>();
    app.get('/private', publicCache(), (c) => {
      c.header('Cache-Control', 'private, no-store');
      return c.json({ ok: true }, 200);
    });

    const resp = await app.request('/private');

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
