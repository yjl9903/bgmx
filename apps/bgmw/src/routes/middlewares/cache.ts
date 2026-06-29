import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../../env';

export const PUBLIC_CACHE_CONTROL = 'public, max-age=60, s-maxage=300';

export function publicCache(
  cacheControl: string = PUBLIC_CACHE_CONTROL
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    await next();

    if (c.res.status >= 200 && c.res.status < 300 && !c.res.headers.has('Cache-Control')) {
      c.res.headers.set('Cache-Control', cacheControl);
    }
  };
}
