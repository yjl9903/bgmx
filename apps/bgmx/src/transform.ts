import { CalendarSubject, DatabaseSubject } from './client';

export function transformDatabaseSubject(item: DatabaseSubject, options: { full?: boolean } = {}) {
  // const images = item.bangumi.images;

  return options.full
    ? {
        id: item.id,
        title: item.title,
        platform: item.bangumi.platform,
        onair_date: item.onair_date || item.bangumi.date,
        poster: item.poster || item.bangumi.images.large || '',
        // images: (['large', 'common', 'medium', 'small', 'grid'] as const).map((quality) => ({
        //   provider: 'bgm' as const,
        //   quality,
        //   src: images[quality]
        // })),
        summary: item.bangumi.summary || '',
        alias: item.alias,
        tags: [...new Set([...(item.bangumi?.meta_tags ?? []), ...(item.bangumi?.tags ?? [])])],
        search: item.search
      }
    : {
        id: item.id,
        title: item.title,
        platform: item.bangumi.platform,
        onair_date: item.onair_date || item.bangumi.date,
        poster: item.poster || item.bangumi.images.large || '',
        alias: item.alias,
        tags: [...new Set([...(item.bangumi?.meta_tags ?? []), ...(item.bangumi?.tags ?? [])])],
        search: item.search
      };
}

export function transformCalendarSubject(item: CalendarSubject, options: { full?: boolean } = {}) {
  return options.full
    ? {
        id: item.id,
        title: item.title,
        alias: item.alias,
        platform: item.bangumi.platform,
        onair_date: item.onair_date || item.bangumi.date,
        poster: item.poster || item.bangumi.images.large || '',
        summary: item.bangumi.summary || '',
        tags: [...new Set([...(item.bangumi?.meta_tags ?? []), ...(item.bangumi?.tags ?? [])])],
        search: item.search
      }
    : {
        id: item.id,
        title: item.title,
        alias: item.alias,
        platform: item.bangumi.platform,
        onair_date: item.onair_date || item.bangumi.date,
        poster: item.poster || item.bangumi.images.large || '',
        tags: [...new Set([...(item.bangumi?.meta_tags ?? []), ...(item.bangumi?.tags ?? [])])],
        search: item.search
      };
}
