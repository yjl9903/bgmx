import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types/index.ts',
    cli: 'src/cli.ts'
  },
  exports: true,
});
