import { describe, expect, it } from 'vitest';

import { trimSeason } from '../src/utils/season';

describe('season', () => {
  it('should return trimmed season suffix and number', () => {
    expect(
      trimSeason({
        name: 'MyGO!!!!! 第2季',
        alias: ['MyGO!!!!! 2nd Season']
      })
    ).toEqual({
      name: 'MyGO!!!!! 第2季',
      original: ['MyGO!!!!!'],
      season: '第2季',
      seasonNumber: 2
    });
  });

  it('should parse chinese season number', () => {
    expect(
      trimSeason({
        name: '某作品 第十二季',
        alias: []
      })
    ).toEqual({
      name: '某作品 第十二季',
      original: ['某作品'],
      season: '第十二季',
      seasonNumber: 12
    });
  });

  it('should not report season info for non-season suffix', () => {
    expect(
      trimSeason({
        name: '某作品 (2024)',
        alias: []
      })
    ).toEqual({
      name: '某作品 (2024)',
      original: ['某作品'],
      season: undefined,
      seasonNumber: undefined
    });
  });
});
