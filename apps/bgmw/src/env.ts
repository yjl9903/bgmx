/// <reference types="@cloudflare/workers-types" />

import type { Context as HonoContext } from 'hono';

import type { Database } from './database';

export type ServiceBindings = {
  SECRET: string;
  DATABASE: D1Database;
};

export type AppVariables = {
  requestId: string;
  responseTimestamp: Date;
  database: Database;
};

export type AppEnv = {
  Bindings: ServiceBindings;
  Variables: AppVariables;
};

export type Context = HonoContext<AppEnv>;
