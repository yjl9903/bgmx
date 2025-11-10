import type { SubjectInformation } from 'bgmc';

import { fullToHalf, tradToSimple } from 'simptrad';

export function normalizeTitle(t: string) {
  return fullToHalf(tradToSimple(t), { punctuation: true });
}

export function getSubjectDisplayName(bgm?: Pick<SubjectInformation, 'name' | 'name_cn'>) {
  return bgm?.name_cn || bgm?.name || '';
}

function getSubjectInfoboxArray(
  infobox: (SubjectInformation['infobox'] & {})[0] | undefined | null
): string[] {
  return Array.isArray(infobox?.value)
    ? ((infobox?.value.map((v) => v?.v).filter(Boolean) as string[]) ?? [])
    : typeof infobox?.value === 'string'
      ? [infobox.value]
      : [];
}

export function getSubjectAlias(subject: Pick<SubjectInformation, 'infobox' | 'name' | 'name_cn'>) {
  const aliasBox =
    subject.infobox?.filter((box) => ['别名', '中文名', '英文名'].includes(box.key)) ?? [];
  const translations = aliasBox?.flatMap((box) => getSubjectInfoboxArray(box)) ?? [];
  return [
    ...new Set(
      [subject.name, subject.name_cn, ...translations].filter(Boolean).map(decodeSubjectTitle)
    )
  ].sort();
}

// Fix `&quot;Oshi no Ko&quot; 2` -> `"Oshi no Ko" 2`
export function decodeSubjectTitle(name: string) {
  return name
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
