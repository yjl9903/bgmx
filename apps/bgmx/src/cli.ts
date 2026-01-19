import 'dotenv/config';

import pLimit from 'p-limit';
import { breadc } from 'breadc';
import { consola } from 'consola';
import { fetchResources } from '@animegarden/client';
import bangumiData from 'bangumi-data' with { type: 'json' };

import { getSubjectDisplayName } from 'bgmt';

import { version } from '../package.json';

import { formatDatetime } from './utils';
import {
  dumpDataBy,
  dumpCalendar,
  matchBgmId,
  fetchYucData,
  writeSession,
  printSubject,
  printBangumiSubject,
  printCalendar
} from './commands';
import {
  type DatabaseBangumi,
  type DatabaseSubject,
  type CalendarInput,
  fetchAndUpdateBangumiSubject,
  fetchBangumiSubjects,
  fetchSubject,
  fetchSubjects,
  fetchCalendar,
  updateCalendar
} from './client';
import { transformDatabaseSubject } from './transform';

const cli = breadc('bgmx', { version })
  .option('--base-url <url>', 'API 地址, 默认值: https://bgm.animes.garden')
  .option('-s, --secret <string>', 'API 密钥');

cli
  .command('sync subject', '拉取所有 bgmx 条目数据')
  .option('--out-dir <directory>', '输出目录, 默认值: data/subject')
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const subjects: ReturnType<typeof transformDatabaseSubject>[] = [];

    for await (const subject of fetchSubjects({ baseURL: options.baseUrl, retry: options.retry })) {
      // console.info(`${subject.title} (id: ${subject.id})`);
      subjects.push(transformDatabaseSubject(subject, { full: true }));
    }

    consola.success(`成功拉取 ${subjects.length} 条数据`);

    await dumpDataBy(
      options.outDir ?? 'data/subject',
      subjects,
      (item) => {
        const date = item.onair_date;
        if (date) {
          const [year, month] = date.split('-');
          return `${year}/${month}`;
        } else {
          return 'tbd';
        }
      },
      (a, b) => a.id - b.id
    );
  });

cli
  .command('sync bangumi', '拉取并更新所有 bangumi 条目数据')
  .option('--update-server', '是否更新服务端数据, 默认值: true', { default: true })
  .option('--log <file>', '日志文件, 默认值: sync-bangumi.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/bangumi')
  .option('--concurrency <number>', '并发数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }

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
          secret
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

      if (options.updateServer && secret) {
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

          if (options.updateServer && secret) {
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

    // 4. 数据持久化
    const bangumis = [...updated.values()];
    await dumpDataBy(
      options.outDir ?? 'data/bangumi',
      bangumis,
      (item) => {
        const date = item.data.date;
        if (date) {
          const [year, month] = date.split('-');
          return `${year}/${month}`;
        } else {
          return 'tbd';
        }
      },
      (a, b) => a.id - b.id
    );

    // 5. 写入错误日志
    {
      const logFile = options.log ?? 'sync-bangumi.md';
      const content: string[] = [];

      content.push('## bgmx fetch bangumi');
      content.push(``);
      if (unknown.length > 0) {
        content.push(`### bangumi-data`);
        content.push(``);
        for (const item of unknown) {
          content.push(`- 缺失 bangumi 信息: ${item.title}`);
        }
        content.push(``);
      }
      if (errors.size > 0) {
        content.push(`### 更新错误`);
        content.push(``);
        for (const [bgmId, error] of errors) {
          content.push(`- 更新失败 ${bgmId} : ${error.message}`);
        }
        content.push(``);
      }

      const { writeFile } = await import('node:fs/promises');
      await writeFile(logFile, content.join('\n'), 'utf-8');
    }

    if (options.updateServer && secret) {
      console.info(`更新结束, 成功更新 ${updated.size} 条，失败 ${errors.size} 条`);
    } else {
      console.info(`成功拉取 ${updated.size} 条数据`);
    }
  });

cli
  .command('sync tmdb', '拉取并更新所有 tmdb 条目数据')
  .option('--update-server', '是否更新服务端数据, 默认值: true', { default: true })
  .option('--log <file>', '日志文件, 默认值: sync-tmdb.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/tmdb')
  .option('--concurrency <number>', '并发数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }
  });

cli
  .command('sync yuc', '拉取并更新 yuc.wiki 周历数据')
  .option('--update-server', '是否更新服务端数据, 默认值: true', { default: true })
  .option('--session <file>', `会话文件, 默认值: yuc-{year}-{month}.yaml`)
  .option('--force-overwrite', '强制覆盖会话文件数据, 默认值: false')
  .option('--year <year>', '年份, 默认值: ' + new Date().getFullYear())
  .option('--month <month>', '月份, 可选值: 1, 4, 7, 10')
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }

    const data = await fetchYucData({
      year: options.year ? +options.year : undefined,
      month: options.month ? +options.month : undefined,
      session: options.session,
      force: options.forceOverwrite
    });

    if (!data.valid) {
      const subjects: DatabaseSubject[] = [];
      for await (const subject of fetchSubjects()) {
        subjects.push(subject);
      }
      subjects.sort((a, b) =>
        a.data.onair_date && b.data.onair_date
          ? new Date(b.data.onair_date).getTime() - new Date(a.data.onair_date).getTime()
          : b.id - a.id
      );

      const match = async (item: { id: number }, names: string[]) => {
        if (item.id === -1) {
          const id = matchBgmId(subjects, names, { year: data.year, month: data.month });
          item.id = id;
        }

        if (item.id !== -1) {
          const subject = subjects.find((s) => s.id === item.id);
          if (subject) {
            console.info(
              `${names[0]} -> ${subject.title} (id: ${subject.id}, ${subject.data.onair_date ?? '?'})`
            );
          } else {
            console.error(`未知 subject ${item.id}`);
          }

          if (secret && options.updateServer) {
            await fetchAndUpdateBangumiSubject(item.id, {
              baseURL: options.baseUrl,
              secret
            });
          }
        }
      };

      for (const item of data.items) {
        await match(item, [item.name_cn, item.name_jp]);
      }
      for (const row of data.calendar) {
        for (const item of row) {
          await match(item, [item.name]);
        }
      }
      for (const item of data.web) {
        await match(item, [item.name]);
      }

      await writeSession(data.session, data);

      consola.success('抓取周历数据成功');
    }

    const calendar: CalendarInput[] = [];
    for (let i = 0; i < data.calendar.length; i++) {
      const row = data.calendar[i];
      for (const item of row) {
        calendar.push({
          id: item.id,
          platform: 'tv',
          weekday: i
        });
      }
    }
    for (let i = 0; i < data.web.length; i++) {
      const item = data.web[i];
      calendar.push({
        id: item.id,
        platform: 'web',
        weekday: null
      });
    }

    if (secret && options.updateServer) {
      {
        // 补齐未抓取过的 subject
        const allSubjects = new Set<number>();
        for await (const subject of fetchSubjects({
          baseURL: options.baseUrl,
          retry: options.retry
        })) {
          allSubjects.add(subject.id);
        }
        const missing = [];
        for (let i = 0; i < data.calendar.length; i++) {
          const row = data.calendar[i];
          for (const item of row) {
            if (item.id === -1) {
              throw new Error(`存在位置 subject ${item.name}`);
            }
            if (!allSubjects.has(item.id)) {
              missing.push(item.id);
            }
          }
        }
        for (let i = 0; i < data.web.length; i++) {
          const item = data.web[i];
          if (item.id === -1) {
            throw new Error(`存在位置 subject ${item.name}`);
          }
          if (!allSubjects.has(item.id)) {
            missing.push(item.id);
          }
        }
        for (const id of missing) {
          await fetchAndUpdateBangumiSubject(id, {
            baseURL: options.baseUrl,
            secret
          });
        }
      }

      await updateCalendar(calendar, { baseURL: options.baseUrl, secret });
      consola.success('更新周历数据成功');
    }
  });

cli
  .command('calendar', '拉取当前周历数据')
  .option('--out <file>', '输出目标文件')
  .option('--version <version>', '输出文件版本号')
  .option('--full', '输出完整 subject 条目')
  .action(async (options) => {
    const resp = await fetchCalendar({ baseURL: options.baseUrl });

    printCalendar(resp.calendar, resp.web);

    if (options.out) {
      await dumpCalendar(options.out, resp.calendar, resp.web, {
        full: options.full,
        version: options.version
      });
    }
  });

cli.command('subject <id>', '查询 bgmx 条目').action(async (id, options) => {
  const secret = options.secret ?? process.env.SECRET;

  const resp = await fetchSubject(+id, {
    baseURL: options.baseUrl,
    secret
  });

  printSubject(resp);
});

cli
  .command('subject revision <subject_id>', '创建 bgmx 条目的修订')
  .action((subjectId, options) => {});

cli
  .command('subject revision disable <subject_id> <revision_id>', '禁用某个 bgmx 条目的修订')
  .action((subjectId, revisionId, options) => {});

cli
  .command('subject revision enable <subject_id> <revision_id>', '启用某个 bgmx 条目的修订')
  .action((subjectId, revisionId, options) => {});

cli
  .command('garden <subject_id>', '查询条目对应的 AnimeGarden 资源')
  .action(async (subjectId, options) => {
    const secret = options.secret ?? process.env.SECRET;

    const { subject } = await fetchSubject(+subjectId, {
      baseURL: options.baseUrl,
      secret
    });

    const resp = await fetchResources({
      include: subject.search.include,
      exclude: subject.search.exclude,
      keywords: subject.search.keywords,
      after: subject.search.after,
      before: subject.search.before
    });

    for (const resource of resp.resources) {
      console.log(`${resource.title} ${formatDatetime(resource.createdAt)}`);
    }
  });

cli.command('bangumi subject <id>', '查询并更新 bangumi 条目').action(async (id, options) => {
  const secret = options.secret ?? process.env.SECRET;

  const resp = await fetchAndUpdateBangumiSubject(+id, {
    baseURL: options.baseUrl,
    secret
  });

  printBangumiSubject(resp);
});

if (process.stdin.isTTY) {
  consola.wrapConsole();
}

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
