import { intro, isCancel, select, multiselect, text, outro } from '@clack/prompts';

import {
  type DatabaseSubject,
  type FetchOptions,
  createRevision as createRevisionAPI
} from '../../client';

export async function createRevision(subject: DatabaseSubject, options: FetchOptions) {
  intro(`为 ${subject.id} 创建修订`);

  const field = await select({
    message: '选择修改的字段',
    options: [
      { value: 'search.include', label: 'search.include' },
      { value: 'search.exclude', label: 'search.exclude' },
      { value: 'search.keywords', label: 'search.keywords' },
      { value: 'search.before', label: 'search.before' },
      { value: 'search.after', label: 'search.after' }
    ]
  });

  if (isCancel(field)) return undefined;

  if (field === 'search.after' || field === 'search.before') {
    const timestamp = await text({
      message: field === 'search.after' ? '输入开始时间' : '输入结束时间',
      validate: (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return '时间非法';
        }
      }
    });
    if (isCancel(timestamp)) return undefined;

    const resp = await createRevisionAPI(
      subject.id,
      { operation: 'field.set', path: field, value: new Date(timestamp).getTime() },
      options
    );

    outro(`修订创建完成`);

    return resp;
  }

  if (field === 'search.include' || field === 'search.exclude' || field === 'search.keywords') {
    const operation = await select({
      message: '选择操作类型',
      options: [
        { value: 'set.add', label: 'set.add' },
        { value: 'set.delete', label: 'set.delete' },
        { value: 'field.set', label: 'field.set' }
      ]
    });
    if (isCancel(operation)) return undefined;

    if (operation === 'set.delete') {
      const original =
        field === 'search.include'
          ? subject.search.include
          : field === 'search.exclude'
            ? subject.search.exclude || []
            : field === 'search.keywords'
              ? subject.search.keywords || []
              : [];
      const deleted = await multiselect({
        message: '选择需要删除的关键词',
        options: original.map((text) => ({ value: text, label: text }))
      });
      if (isCancel(deleted) || deleted.length === 0) return undefined;

      const resp = await createRevisionAPI(
        subject.id,
        { operation: 'set.delete', path: field, value: deleted },
        options
      );

      outro(`修订创建完成`);

      return resp;
    } else {
      const words: string[] = [];
      while (true) {
        const word = await text({
          message: '输入关键词'
        });
        if (isCancel(word)) {
          break;
        }
        if (word) {
          words.push(word);
        }
      }
      if (words.length === 0) return undefined;

      const resp = await createRevisionAPI(
        subject.id,
        { operation, path: field, value: words },
        options
      );

      outro(`修订创建完成`);

      return resp;
    }
  }
}
