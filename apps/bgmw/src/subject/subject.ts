import { decodeSubjectTitle, normalizeSummary, normalizeTags } from 'bgmt';

import type {
  Bangumi as DatabaseBangumi,
  Revision,
  Subject,
  SubjectAlias,
  SubjectBangumiData
} from '../schema/types';

import { applyRevisions } from './revision';

/**
 * 组合 subject 信息
 */
export async function createDatabaseSubject(bangumi: DatabaseBangumi, revisions: Revision[]) {
  const metadata = await findBangumiDataItem(bangumi.id);
  const title = decodeSubjectTitle(bangumi.data.name);
  const alias = getSubjectAlias(bangumi, metadata);

  const subject: Subject = {
    id: bangumi.id,
    title,
    bangumi: getSubjectBangumiData(bangumi),
    tmdb: null,
    poster: bangumi.data.images.large,
    onair_date: bangumi.data.date ?? getBangumiDataDate(metadata),
    alias,
    search: {
      include: Object.values(alias).flat()
    },
    updatedAt: new Date()
  };

  return applyRevisions(subject, revisions).subject;
}

function getSubjectBangumiData(bangumi: DatabaseBangumi): SubjectBangumiData {
  return {
    id: bangumi.data.id,
    type: bangumi.data.type,
    name: decodeSubjectTitle(bangumi.data.name),
    name_cn: decodeSubjectTitle(bangumi.data.name_cn),
    summary: normalizeSummary(bangumi.data.summary),
    date: bangumi.data.date,
    platform: bangumi.data.platform,
    images: bangumi.data.images,
    eps: bangumi.data.eps,
    total_episodes: bangumi.data.total_episodes,
    meta_tags: bangumi.data.meta_tags,
    tags: normalizeTags(bangumi.data.tags, { count: 10 }),
    rating: {
      score: bangumi.data.rating.score,
      rank: bangumi.data.rating.rank
    }
  };
}

type BangumiDataItem = {
  title: string;
  titleTranslate: Record<string, string[]>;
  lang: string;
  begin?: string | undefined;
  sites: { site: string; id: string }[];
};

let bangumiDataPromise: Promise<BangumiDataItem[]> | undefined;

async function fetchBangumiDataItems() {
  bangumiDataPromise ??= fetch('https://unpkg.com/bangumi-data@0/dist/data.json')
    .then((resp) => {
      if (!resp.ok) throw new Error('Fetch bangumi-data failed', { cause: resp });
      return resp.json() as Promise<{ items: BangumiDataItem[] }>;
    })
    .then((data) => data.items);

  try {
    return await bangumiDataPromise;
  } catch (error) {
    bangumiDataPromise = undefined;
    console.warn('[bgmw] failed to fetch bangumi-data', error);
    return [];
  }
}

async function findBangumiDataItem(id: number) {
  const items = await fetchBangumiDataItems();
  return items.find((item) =>
    item.sites.some((site) => site.site === 'bangumi' && Number(site.id) === id)
  );
}

function getBangumiDataDate(item: BangumiDataItem | undefined) {
  return item?.begin?.slice(0, 10);
}

function getSubjectAlias(
  bangumi: DatabaseBangumi,
  item: BangumiDataItem | undefined
): SubjectAlias {
  const alias: Record<'ja' | 'zh' | 'en', Set<string>> = {
    ja: new Set(),
    zh: new Set(),
    en: new Set()
  };
  const add = (lang: keyof typeof alias, values: (string | undefined)[]) => {
    for (const value of values) {
      const title = value && decodeSubjectTitle(value);
      if (title && !Object.values(alias).some((values) => values.has(title))) {
        alias[lang].add(title);
      }
    }
  };

  add('ja', [bangumi.data.name]);
  add('zh', [bangumi.data.name_cn]);

  if (item) {
    add(toAliasLanguage(item.lang), [item.title]);
    for (const [lang, values] of Object.entries(item.titleTranslate)) {
      add(toAliasLanguage(lang), values);
    }
  }

  for (const box of bangumi.data.infobox ?? []) {
    const values = getInfoboxValues(box);
    if (box.key === '中文名') add('zh', values);
    else if (box.key === '英文名') add('en', values);
    else if (box.key === '别名') {
      for (const value of values) add(guessAliasLanguage(value), [value]);
    }
  }

  return Object.fromEntries(
    Object.entries(alias)
      .map(([lang, values]) => [lang, [...values]])
      .filter(([, values]) => values.length > 0)
  ) as SubjectAlias;
}

function getInfoboxValues(box: NonNullable<DatabaseBangumi['data']['infobox']>[number]) {
  return Array.isArray(box.value)
    ? box.value.map((item) => item?.v).filter(Boolean)
    : typeof box.value === 'string'
      ? [box.value]
      : [];
}

function toAliasLanguage(lang: string): 'ja' | 'zh' | 'en' {
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  return 'ja';
}

function guessAliasLanguage(value: string): 'ja' | 'zh' | 'en' {
  if (/[\u3040-\u30ff]/.test(value)) return 'ja';
  if (/[\u4e00-\u9fff]/.test(value)) return 'zh';
  if (/^[\x00-\x7f]+$/.test(value)) return 'en';
  return 'ja';
}
