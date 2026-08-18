import { describe, expect, it } from 'vitest';

import { transformDatabaseSubject } from '../src/transform';

const subject = {
  id: 1,
  title: 'Title',
  poster: '',
  onair_date: null,
  alias: {},
  search: { include: ['Title'] },
  bangumi: {
    date: '2026-07-01',
    platform: 'TV',
    images: {
      large: 'large.jpg',
      common: 'common.jpg',
      medium: 'medium.jpg',
      small: 'small.jpg',
      grid: 'grid.jpg'
    },
    summary: 'summary',
    meta_tags: ['tag'],
    tags: ['tag', 'anime']
  }
} as any;

describe('transformDatabaseSubject', () => {
  it('does not expose parsed images', () => {
    expect(transformDatabaseSubject(subject, { full: true })).not.toHaveProperty('images');
    expect(transformDatabaseSubject(subject)).not.toHaveProperty('images');
  });
});
