import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client/index.ts',
    types: 'src/types.ts',
    cli: 'src/cli.ts'
  },
  exports: true
});
