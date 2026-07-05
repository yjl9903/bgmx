import type { DatabaseSubject } from '../../client';

import { distance } from 'fastest-levenshtein';

const REs = [
  /(?:S|Season|season\s?)(\d+)$/,
  /(1st|2nd|3rd|[456789]th) Season$/,
  /Part\.(\d+)$/,
  /第?(\d+)(?:季|期|部分)$/,
  /第?((?:[零一二三四五六七八九]十|十)?[零一二三四五六七八九])(?:季|期|部分)$/,
  /\((?:19|20)\d{2}\)$/
];

export function trimSeason(t: string) {
  for (const RE of REs) {
    const match = RE.exec(t);
    if (match) {
      return t.slice(0, t.length - match[0].length).trimEnd();
    }
  }
  return t;
}

export function matchBgmId(
  subjects: DatabaseSubject[],
  names: string[],
  extra: { year?: number; month?: number }
) {
  for (const subject of subjects) {
    const targets = [subject.title, ...subject.search.include];

    const names2 = names.map((name) => trimSeason(name));
    const targets2 = targets.map((target) => trimSeason(target));

    for (const name of names) {
      if (targets.some((target) => target.indexOf(name) !== -1)) {
        if (matchDate(subject, extra)) {
          return subject.id;
        }
      }
    }
    for (const name of names) {
      if (
        name.length >= 6 &&
        targets.some((target) => target.length >= 6 && distance(target, name) <= 3)
      ) {
        if (matchDate(subject, extra)) {
          return subject.id;
        }
      }
    }

    for (const name of names2) {
      if (targets2.some((target) => target.indexOf(name) !== -1)) {
        if (matchDate(subject, extra)) {
          return subject.id;
        }
      }
    }
    for (const name of names2) {
      if (
        name.length >= 6 &&
        targets2.some((target) => target.length >= 6 && distance(target, name) <= 3)
      ) {
        if (matchDate(subject, extra)) {
          return subject.id;
        }
      }
    }
  }
  return -1;
}

function matchDate(subject: DatabaseSubject, extra: { year?: number; month?: number }) {
  if (subject.onair_date && extra.year && extra.month) {
    const d1 = new Date(extra.year, extra.month - 1, 1);
    const d2 = new Date(subject.onair_date);

    return (
      Math.abs(
        d1.getFullYear() * 12 + (d1.getMonth() - 1) - d2.getFullYear() * 12 - (d2.getMonth() - 1)
      ) <= 4
    );
  }
  return true;
}
