/// <reference types="node" />

import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw error;
  }
}

export default defineConfig({
  dialect: 'sqlite',
  out: './drizzle',
  schema: './src/schema/'
});
