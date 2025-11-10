import { describe, it, expect } from 'vitest';

import { normalizeTags } from '../src/utils/tags';

describe('tags', () => {
  it.each([
    [['2025', '2025年', '10月', '2025年10月'], ['2025年10月']],
    [['10月', '2025', '2025年', '2025年10月'], ['2025年10月']],
    [['2025', '2025年', '2025年10月'], ['2025年10月']],
    [['2025', '2025年', '2025年10月', '2025秋'], ['2025年10月']]
  ])('should normalize %o -> %o', (input: string[], expected: string[]) => {
    expect(normalizeTags(input.map((t) => ({ name: t, count: 1 })))).toEqual(expected);
  });
});
