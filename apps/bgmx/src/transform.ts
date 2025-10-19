import { normalizeSummary } from 'bgmt';

import { CalendarSubject, DatabaseSubject } from './client';

export function transformDatabaseSubject(item: DatabaseSubject, options: { full?: boolean } = {}) {
  return options.full
    ? {
        id: item.id,
        title: item.title,
        platform: item.data.platform,
        onair_date: item.data.onair_date,
        rating: item.data.rating,
        poster: item.data.poster,
        images: item.data.images,
        summary: normalizeSummary(item.data.summary),
        alias: item.data.alias,
        tags: item.data.tags,
        search: item.search
      }
    : {
        id: item.id,
        title: item.title,
        platform: item.data.platform,
        onair_date: item.data.onair_date,
        rating: item.data.rating,
        poster: item.data.poster,
        tags: item.data.tags,
        search: item.search
      };
}

export function transformCalendarSubject(item: CalendarSubject, options: { full?: boolean } = {}) {
  return options.full
    ? {
        id: item.id,
        title: item.title,
        platform: item.data.platform || item.platform,
        onair_date: item.data.onair_date,
        rating: item.data.rating,
        poster: item.data.poster,
        images: item.data.images,
        summary: normalizeSummary(item.data.summary),
        alias: item.data.alias,
        tags: item.data.tags,
        search: item.search
      }
    : {
        id: item.id,
        title: item.title,
        platform: item.data.platform || item.platform,
        onair_date: item.data.onair_date,
        rating: item.data.rating,
        poster: item.data.poster,
        tags: item.data.tags,
        search: item.search
      };
}
