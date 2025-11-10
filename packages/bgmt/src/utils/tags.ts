import { fullToHalf, tradToSimple } from 'simptrad';

export interface Tag {
  name: string;

  count: number;
}

export interface NormalizeTagsOptions {
  /**
   * @default 0
   */
  count?: number;
}

const MERGE_TAGS = [
  ['漫改', '漫画改'],
  ['轻改', '轻小说改'],
  ['东映アニメーション', '东映动画'],
  ['TV', 'TVA']
];

const REMOVE_TAGS = new Set(['未定档', '未确定', '日本', '日本动画']);

export function normalizeTags(tags: Tag[], options: NormalizeTagsOptions = {}) {
  const merged = mergeSimpleTags(tags.filter((t) => !REMOVE_TAGS.has(t.name)));
  const reliable = options.count ? merged.filter((t) => t.count >= options.count!) : merged;
  return reliable.map((t) => t.name).sort();
}

function mergeSimpleTags(tags: Tag[]) {
  const map = new Map<string, number>();
  for (const t of tags) {
    // 2025秋 -> 2025年10月
    if (/(19|20)\d{2}(春|夏|秋|冬)/.test(t.name)) {
      if (t.name.includes('春')) {
        t.name = t.name.replace('春', '年4月');
      } else if (t.name.includes('夏')) {
        t.name = t.name.replace('夏', '年7月');
      } else if (t.name.includes('秋')) {
        t.name = t.name.replace('秋', '年10月');
      } else if (t.name.includes('冬')) {
        t.name = t.name.replace('冬', '年1月');
      }
    }
    // 2025年秋 -> 2025年10月
    if (/(19|20)\d{2}年(春|夏|秋|冬)/.test(t.name)) {
      if (t.name.includes('春')) {
        t.name = t.name.replace('春', '4月');
      } else if (t.name.includes('夏')) {
        t.name = t.name.replace('夏', '7月');
      } else if (t.name.includes('秋')) {
        t.name = t.name.replace('秋', '10月');
      } else if (t.name.includes('冬')) {
        t.name = t.name.replace('冬', '1月');
      }
    }
    if (/(19|20)\d{2}?|\d{1,2}月/.test(t.name)) {
      // 2025 -> 2025年 -> 2025年10月
      // 10月 -> 2025年10月
      let target = t.name;
      for (const tt of tags) {
        if (tt.name.indexOf(t.name) !== -1 && tt.name.length > target.length) {
          target = tt.name;
        }
      }
      t.name = target;
    }

    const name0 = t.name;
    const name1 = fullToHalf(tradToSimple(name0), { punctuation: true });
    const name2 = MERGE_TAGS.find((arr) => arr.includes(name1))?.[0] ?? name1;

    const name = name2;
    map.set(name, (map.get(name) ?? 0) + t.count);
  }
  return [...map.entries()].map(([k, v]) => ({ name: k, count: v }));
}
