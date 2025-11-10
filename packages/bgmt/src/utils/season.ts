const REs = [
  /(?:S|Season|season\s?)(\d+)$/,
  /(1st|2nd|3rd|[456789]th) Season$/,
  /第?(\d+)[季期]$/,
  /第?((?:[零一二三四五六七八九]十|十)?[零一二三四五六七八九])[季期]$/,
  /\((?:19|20)\d{2}\)$/
];

export function trimSeason(bgm: { name: string; alias: string[] }) {
  let changed = false;
  function trim(t: string) {
    for (const RE of REs) {
      const match = RE.exec(t);
      if (match) {
        changed = true;
        return t.slice(0, t.length - match[0].length).trimEnd();
      }
    }
  }

  const trimmed = bgm.alias.map(trim);
  trimmed.push(trim(bgm.name));

  const original = [...new Set(trimmed.filter(Boolean))].sort() as string[];

  if (original.length === bgm.alias.length && !changed) {
    return {
      name: bgm.name,
      original: undefined
    };
  }

  return {
    name: bgm.name,
    original
  };
}
