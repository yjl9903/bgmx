import { Hono } from 'hono';

import type { AppEnv } from '../env';

const router = new Hono<AppEnv>();

router.get('/', (c) => {
  return c.json(
    {
      ok: true,
      message: 'This is https://github.com/yjl9903/bgmx'
    },
    200
  );
});

router.get('/health', (c) => {
  return c.json(
    {
      ok: true,
      message: 'This is https://github.com/yjl9903/bgmx'
    },
    200
  );
});

export const healthRoute = router;
