import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cdn: 'src/cdn/index.ts'
  },
  exports: true,
});
