import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDatabaseSubject } from '../src/subject/subject';

describe('createDatabaseSubject', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses bangumi raw data and derives top-level fields from bangumi-data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          items: [
            {
              title: 'Original JP',
              titleTranslate: {
                'zh-Hans': ['中文名'],
                en: ['English Name']
              },
              lang: 'ja',
              begin: '2026-07-01T00:00:00.000Z',
              sites: [{ site: 'bangumi', id: '1' }]
            }
          ]
        })
      }))
    );

    const subject = await createDatabaseSubject(
      {
        id: 1,
        data: {
          id: 1,
          name: 'Original JP',
          name_cn: '中文名',
          summary: ' summary\r\n',
          date: undefined,
          images: {
            large: 'poster.jpg',
            common: 'common.jpg',
            medium: 'medium.jpg',
            small: 'small.jpg',
            grid: 'grid.jpg'
          },
          rating: { score: 7.5, rank: 100 },
          tags: [{ name: '漫画改', count: 11 }],
          infobox: [
            { key: '英文名', value: 'English Name' },
            { key: '别名', value: [{ v: 'Original JP' }] }
          ]
        },
        persons: [],
        characters: [],
        subjects: [],
        updatedAt: new Date()
      } as any,
      []
    );

    expect(subject.title).toBe('Original JP');
    expect(subject.poster).toBe('poster.jpg');
    expect(subject.onair_date).toBe('2026-07-01');
    expect(subject.alias).toEqual({
      en: ['English Name'],
      ja: ['Original JP'],
      zh: ['中文名']
    });
    expect(subject.search.include).toEqual(['Original JP', '中文名', 'English Name']);
    expect(subject.bangumi.name).toBe('Original JP');
    expect(subject.bangumi.summary).toBe('summary');
    expect(subject.bangumi.tags).toEqual(['漫改']);
    expect(subject.bangumi.rating).toEqual({ score: 7.5, rank: 100 });
    expect(subject.bangumi.images).toEqual({
      large: 'poster.jpg',
      common: 'common.jpg',
      medium: 'medium.jpg',
      small: 'small.jpg',
      grid: 'grid.jpg'
    });
    expect(subject.tmdb).toBeNull();
  });
});
