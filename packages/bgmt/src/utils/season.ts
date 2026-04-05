const digits: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

const seasonMatchers = [
  {
    re: /(?:S|Season|season)\s?(\d+)$/,
    parse: (match: RegExpExecArray) => +match[1]
  },
  {
    re: /(\d+)(?:st|nd|rd|th) Season$/,
    parse: (match: RegExpExecArray) => +match[1]
  },
  {
    re: /第?(\d+)(?:季|期|部分)$/,
    parse: (match: RegExpExecArray) => +match[1]
  },
  {
    re: /第?([零一二三四五六七八九]?十[零一二三四五六七八九]?|[零一二三四五六七八九])(?:季|期|部分)$/,
    parse: (match: RegExpExecArray) => parseChineseNumber(match[1])
  }
] as const;

const extraMatchers = [/\((?:19|20)\d{2}\)$/] as const;

function parseChineseNumber(value: string) {
  if (!value.includes('十')) {
    return digits[value];
  }

  const [tensRaw, onesRaw] = value.split('十');
  const tens = tensRaw ? digits[tensRaw] : 1;
  const ones = onesRaw ? digits[onesRaw] : 0;
  return tens * 10 + ones;
}

type TrimResult = {
  value?: string;
  changed: boolean;
  season?: string;
  seasonNumber?: number;
};

function trimTitle(title: string): TrimResult {
  for (const matcher of seasonMatchers) {
    const match = matcher.re.exec(title);
    if (match) {
      return {
        value: title.slice(0, title.length - match[0].length).trimEnd(),
        changed: true,
        season: match[0],
        seasonNumber: matcher.parse(match)
      };
    }
  }

  for (const re of extraMatchers) {
    const match = re.exec(title);
    if (match) {
      return {
        value: title.slice(0, title.length - match[0].length).trimEnd(),
        changed: true
      };
    }
  }

  return {
    value: undefined,
    changed: false
  };
}

export function trimSeason(bgm: { name: string; alias: string[] }) {
  const nameResult = trimTitle(bgm.name);
  const aliasResults = bgm.alias.map(trimTitle);
  const original = [
    ...new Set([...aliasResults, nameResult].map((item) => item.value).filter(Boolean))
  ].sort() as string[];

  if (
    original.length === bgm.alias.length &&
    !nameResult.changed &&
    aliasResults.every((item) => !item.changed)
  ) {
    return {
      name: bgm.name,
      original: undefined,
      season: undefined,
      seasonNumber: undefined
    };
  }

  const seasonResult = nameResult.season ? nameResult : aliasResults.find((item) => item.season);

  return {
    name: bgm.name,
    original,
    season: seasonResult?.season,
    seasonNumber: seasonResult?.seasonNumber
  };
}
