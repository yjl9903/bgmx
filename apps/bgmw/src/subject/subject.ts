import {
  decodeSubjectTitle,
  getSubjectAlias,
  getSubjectDisplayName,
  normalizeSummary,
  normalizeTags
} from 'bgmt';

import type { Bangumi as DatabaseBangumi, Revision, Subject, SubjectImage } from '../schema';

import { applyRevisions } from './revision';

/**
 * 组合 subject 信息
 */
export function createDatabaseSubject(bangumi: DatabaseBangumi, revisions: Revision[]) {
  const title = decodeSubjectTitle(getSubjectDisplayName(bangumi.data));
  const alias = getSubjectAlias(bangumi.data);

  const subject: Subject = {
    id: bangumi.id,
    title,
    data: {
      id: bangumi.id,
      title,
      platform: bangumi.data.platform,
      onair_date: bangumi.data.date,
      alias,
      rating: {
        score: bangumi.data.rating.score,
        rank: bangumi.data.rating.rank
      },
      summary: normalizeSummary(bangumi.data.summary),
      poster: bangumi.data.images.large,
      images: getSubjectImages(bangumi),
      tags: normalizeTags(bangumi.data.tags, { count: 10 })
    },
    search: {
      include: alias
    },
    updatedAt: new Date()
  };

  return applyRevisions(subject, revisions).subject;
}

function getSubjectImages(bangumi: DatabaseBangumi): SubjectImage[] {
  return [
    {
      provider: 'bgm',
      quality: 'large',
      src: bangumi.data.images.large
    },
    {
      provider: 'bgm',
      quality: 'common',
      src: bangumi.data.images.common
    },
    {
      provider: 'bgm',
      quality: 'medium',
      src: bangumi.data.images.medium
    },
    {
      provider: 'bgm',
      quality: 'small',
      src: bangumi.data.images.small
    },
    {
      provider: 'bgm',
      quality: 'grid',
      src: bangumi.data.images.grid
    }
  ];
}
