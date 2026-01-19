import pLimit from 'p-limit';
import bangumiData from 'bangumi-data' with { type: 'json' };

import { getSubjectDisplayName } from 'bgmt';

import {
  type DatabaseBangumi,
  fetchAndUpdateBangumiSubject,
  fetchBangumiSubjects
} from '../../client';

export interface SyncBangumiOptions {
  secret: string | undefined;
  baseUrl: string | undefined;
  concurrency: number;
  updateServer: boolean;
  retry: number;
}

export async function syncBangumi(options: SyncBangumiOptions) {
  const executing = new Set<number>();
  const updated = new Map<number, DatabaseBangumi>();
  const unknown: typeof bangumiData.items = [];
  const errors = new Map<number, any>();

  const limit = pLimit(options.concurrency);
  const tasks: Promise<DatabaseBangumi | undefined>[] = [];

  const doUpdate = async (bgmId: number) => {
    try {
      const resp = await fetchAndUpdateBangumiSubject(bgmId, {
        baseURL: options.baseUrl,
        secret: options.secret
      });

      updated.set(bgmId, resp);
      errors.delete(bgmId);

      return resp;
    } catch (error) {
      console.error(`更新 ${bgmId} 失败:`, error);

      executing.delete(bgmId);
      errors.set(bgmId, error);

      return undefined;
    }
  };

  // 1. 更新服务端的所有 bangumi 条目
  for await (const subject of fetchBangumiSubjects({ baseURL: options.baseUrl })) {
    console.info(`${getSubjectDisplayName(subject.data)} (id: ${subject.id})`);

    executing.add(subject.id);

    if (options.updateServer && options.secret) {
      tasks.push(limit(() => doUpdate(subject.id)));
    } else {
      updated.set(subject.id, subject);
    }
  }

  await Promise.all(tasks);

  // 2. 更新 bangumi-data 出现的条目
  for (const item of bangumiData.items) {
    const bgmId = item.sites.find((site) => site.site === 'bangumi')?.id;
    if (bgmId) {
      if (!executing.has(+bgmId)) {
        console.info(`${item.title} (id: ${bgmId})`);

        executing.add(+bgmId);

        if (options.updateServer && options.secret) {
          tasks.push(limit(() => doUpdate(+bgmId)));
        }
      }
    } else {
      console.error(`缺失 bangumi 信息:`, item.title);
      unknown.push(item);
    }
  }

  await Promise.all(tasks);

  // 3. 重试
  for (let turn = 0; turn < options.retry && errors.size > 0; turn++) {
    for (const bgmId of errors.keys()) {
      tasks.push(limit(() => doUpdate(bgmId)));
    }
    await Promise.all(tasks);
  }

  return { updated, unknown, errors };
}
