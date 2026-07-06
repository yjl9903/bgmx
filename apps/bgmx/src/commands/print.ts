import { bold, strikethrough } from 'breadc';

import { getSubjectAlias } from 'bgmt';

import type {
  CalendarSubject,
  DatabaseBangumi,
  DatabaseRevision,
  DatabaseSubject
} from '../client';

import { formatDatetime } from '../utils';

export function printBangumiSubject(bangumi: DatabaseBangumi) {
  const subject = bangumi.data;

  const label = (str: string) => {
    return bold(str.padStart(10, ' '));
  };

  console.log(`${label('id')}  ${subject.id}`);
  console.log(`${label('name')}  ${subject.name_cn || subject.name || '?'}`);
  console.log(`${label('platform')}  ${subject.platform}`);
  console.log(`${label('date')}  ${subject.date}`);
  console.log(
    `${label('rating')}  ${subject.rating.score} #${subject.rating.rank} (count. ${subject.rating.total})`
  );

  const alias = getSubjectAlias(subject);
  if (alias.length > 0) {
    console.log(`${label('alias')}  ${alias[0]}`);
    for (const a of alias.slice(1)) {
      console.log(`${label('')}  ${a}`);
    }
  }

  console.log(`${label('updated')}  ${formatDatetime(new Date(bangumi.updatedAt))}`);

  // console.log(subject);
}

export function printSubject(data: { subject: DatabaseSubject; revisions: DatabaseRevision[] }) {
  const subject = data.subject;

  const label = (str: string, prefix = 0) => {
    return bold(str.padEnd(10 - prefix, ' '));
  };

  console.log(`${label('id')}  ${subject.id}`);
  console.log(`${label('name')}  ${subject.title}`);
  console.log(`${label('platform')}  ${subject.bangumi.platform}`);
  console.log(`${label('date')}  ${subject.onair_date}`);
  console.log(
    `${label('rating')}  ${subject.bangumi.rating.score} #${subject.bangumi.rating.rank}`
  );
  console.log(`${label('updated')}  ${formatDatetime(new Date(data.subject.updatedAt))}`);

  console.log('');

  console.log(`${label('search')}`);

  const searchAfter = data.subject.search.after;
  if (searchAfter) {
    console.log(` ${label('after', 1)}  ${formatDatetime(new Date(searchAfter))}`);
  }
  const searchBefore = data.subject.search.before;
  if (searchBefore) {
    console.log(` ${label('before', 1)}  ${formatDatetime(new Date(searchBefore))}`);
  }

  const searchInclude = data.subject.search.include;
  if (searchInclude.length > 0) {
    console.log(` ${label('include', 1)}  ${searchInclude[0]}`);
    for (const a of searchInclude.slice(1)) {
      console.log(` ${label('', 1)}  ${a}`);
    }
  }
  const searchExclude = data.subject.search.exclude;
  if (searchExclude && searchExclude.length > 0) {
    console.log(` ${label('exclude', 1)}  ${searchExclude[0]}`);
    for (const a of searchExclude.slice(1)) {
      console.log(` ${label('', 1)}  ${a}`);
    }
  }

  if (data.revisions.length > 0) {
    console.log('');
    console.log(`${label('revisions')}  x${data.revisions.length}`);
    for (const revision of data.revisions) {
      const text = `${bold(`#${revision.id}`)}: ${revision.detail.operation} ${revision.detail.path} ${revision.detail.value}`;
      console.log(` - ${revision.enabled ? text : `${strikethrough(text)}`}`);
    }
  }
}

export function printCalendar(calendar: CalendarSubject[][], web: CalendarSubject[]) {
  for (let i = 0; i < calendar.length; i++) {
    console.log(bold(['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]));
    for (const item of calendar[i]) {
      console.log(`${item.title} (id: ${item.id}, ${item.onair_date})`);
    }
    console.log();
  }

  console.log(`${bold('web')}`);
  for (const item of web) {
    console.log(`${item.title} (id: ${item.id}, ${item.onair_date})`);
  }
}
