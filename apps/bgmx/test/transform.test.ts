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
  it('keeps parsed images only for full output', () => {
    expect(transformDatabaseSubject(subject, { full: true })).toMatchObject({
      images: [
        { provider: 'bgm', quality: 'large', src: 'large.jpg' },
        { provider: 'bgm', quality: 'common', src: 'common.jpg' },
        { provider: 'bgm', quality: 'medium', src: 'medium.jpg' },
        { provider: 'bgm', quality: 'small', src: 'small.jpg' },
        { provider: 'bgm', quality: 'grid', src: 'grid.jpg' }
      ]
    });

    expect(transformDatabaseSubject(subject)).not.toHaveProperty('images');
  });
});
