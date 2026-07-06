import { describe, expect, it } from 'vitest';

import { normalizeTitle } from 'bgmt';

describe('subject search title normalization', () => {
  it('normalizes titles for loose substring search', () => {
    expect(normalizeTitle('  孤獨 搖滾！ ')).toContain(normalizeTitle('孤独 摇滚'));
  });

  it('normalizes empty punctuation-only titles to empty strings', () => {
    expect(normalizeTitle('!!!')).toBe('');
  });
});
