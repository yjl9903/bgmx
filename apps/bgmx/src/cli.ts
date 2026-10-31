import 'dotenv/config';

import { breadc, InputError } from 'breadc';
import { z } from 'zod';
import { consola } from 'consola';
import { fetchResources } from '@animegarden/client';

import { version } from '../package.json';

import { formatDatetime, formatSeason } from './utils';
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
  type DatabaseSubject,
  type CalendarInput,
  deleteSubject,
  fetchAndUpdateBangumiSubject,
  fetchSubject,
  fetchSubjects,
  fetchCalendar,
  updateCalendar,
  deleteRevision,
  enableRevision,
  disableRevision,
  fetchRevisions,
  refreshSubject
} from './client';
import { transformDatabaseSubject } from './transform';
import { syncBangumi } from './commands/bangumi';
import { createRevision } from './commands/revision';

const cli = breadc('bgmx', {
  version,
  locale: 'zh',
  description: {
    text: '查询番剧条目与周历，同步外部数据并管理条目修订。',
    examples: [
      { command: 'bgmx calendar', comment: '查看当前周历' },
      { command: 'bgmx subject 328609', comment: '查看条目及已启用修订' },
      { command: 'bgmx sync --help', comment: '查看数据同步命令' }
    ]
  }
})
  .option('--base-url <url>', 'API 地址, 默认值: https://bgm.animes.garden')
  .option('-s, --secret <string>', 'API 密钥');

const integer = z.string().trim().min(1, '请输入整数').transform(Number).pipe(z.number().int());

const positiveInteger = integer.pipe(z.number().positive('请输入正整数'));

const seasonMonth = integer.pipe(
  z.union([z.literal(1), z.literal(4), z.literal(7), z.literal(10)])
);

const sync = cli
  .group('sync', {
    summary: '同步条目与周历数据',
    text: '从 bgmx、Bangumi 或 yuc.wiki 获取条目和周历，整理为本地数据或发布到服务端。',
    examples: [
      {
        command: 'bgmx sync subject --out-dir data/subject',
        comment: '导出 bgmx 条目'
      },
      {
        command: 'bgmx sync yuc --year 2026 --month 10',
        comment: '抓取季度周历并生成本地会话文件'
      }
    ]
  })
  .option('--retry <number>', '重试次数，默认 3；负数表示无限重试', {
    default: '3',
    cast: integer
  });

sync
  .command('subject', {
    summary: '导出全部 bgmx 条目',
    text: '从服务端分页读取所有条目，导出完整数据，按开播年份和月份组织文件；没有开播日期的条目放入 tbd。',
    examples: [
      {
        command: 'bgmx sync subject',
        comment: '导出到默认目录'
      },
      {
        command: 'bgmx sync subject --out-dir backup/subject',
        comment: '导出到指定目录'
      }
    ]
  })
  .option('--out-dir <directory>', '输出目录, 默认值: data/subject')
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

sync
  .command('bangumi', {
    summary: '导出并按需刷新 Bangumi 条目',
    text: '读取服务端已有的 Bangumi 条目，并检查 bangumi-data 中的条目映射。导出条目数据，同时将缺失映射和请求失败记录到日志。',
    examples: [
      {
        command: 'bgmx sync bangumi',
        comment: '导出已有数据并生成检查日志'
      },
      {
        command: 'bgmx sync bangumi --update-server --concurrency 3',
        comment: '使用 SECRET 环境变量中的密钥刷新数据'
      }
    ]
  })
  .option('--update-server', '是否更新服务端数据, 默认值: false', { default: false })
  .option('--log <file>', '日志文件, 默认值: sync-bangumi.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/bangumi')
  .option('--concurrency <number>', '并发数，默认 3', {
    default: '3',
    cast: positiveInteger
  })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }

    const { updated, unknown, errors } = await syncBangumi({ ...options, secret });

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

sync
  .command('tmdb', {
    summary: '同步 TMDB 条目（尚未实现）',
    text: '此命令目前只保留参数入口，尚未执行 TMDB 数据抓取、文件导出或服务端更新。',
    examples: [
      {
        command: 'bgmx sync tmdb --help',
        comment: '查看预留参数'
      }
    ]
  })
  .option('--update-server', '是否更新服务端数据, 默认值: false', { default: false })
  .option('--log <file>', '日志文件, 默认值: sync-tmdb.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/tmdb')
  .option('--concurrency <number>', '并发数，默认 3', {
    default: '3',
    cast: positiveInteger
  })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }
  });

sync
  .command('yuc', {
    summary: '抓取并按需发布 yuc.wiki 周历',
    text: '抓取季度周历并匹配条目 ID，整理为可继续编辑的 YAML 会话文件。发布时补齐服务端缺失条目，并提交周历及其活跃状态。',
    examples: [
      {
        command: 'bgmx sync yuc --year 2026 --month 10',
        comment: '抓取季度周历并保存会话'
      },
      {
        command: 'bgmx sync yuc --session yuc-2026-10.yaml --update-server',
        comment: '使用 SECRET 环境变量中的密钥上传已整理的会话'
      },
      {
        command: 'bgmx sync yuc --session yuc-2026-10.yaml --update-server --no-update-active',
        comment: '上传周历并将季度设为非活跃'
      }
    ]
  })
  .option('--session <file>', `会话文件, 默认值: yuc-{year}-{month}.yaml`)
  .option('--force-overwrite', '强制覆盖会话文件数据, 默认值: false')
  .option('--year <year>', '年份, 默认值: ' + new Date().getFullYear(), {
    cast: positiveInteger
  })
  .option('--month <month>', '月份, 可选值: 1, 4, 7, 10', { cast: seasonMonth })
  .option('--update-server', '是否更新服务端数据, 默认值: false', { default: false })
  .option('--[no-]update-active', '更新该季度周历 active 状态，默认启用', {
    default: true
  })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.updateServer) {
      console.warn('未提供 API 密钥，将无法更新数据');
    }

    const data = await fetchYucData({
      year: options.year,
      month: options.month,
      session: options.session,
      force: options.forceOverwrite
    });

    if (!data.valid) {
      const subjects: DatabaseSubject[] = [];
      for await (const subject of fetchSubjects()) {
        subjects.push(subject);
      }
      subjects.sort((a, b) =>
        a.onair_date && b.onair_date
          ? new Date(b.onair_date).getTime() - new Date(a.onair_date).getTime()
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
              `${names[0]} -> ${subject.title} (id: ${subject.id}, ${subject.onair_date ?? '?'})`
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
      for (const list of [data.web, data.korean, data.short, data.motion, data.adult]) {
        for (const item of list) {
          await match(item, [item.name]);
        }
      }

      await writeSession(data.session, data);

      consola.success('抓取周历数据成功');
    }

    const season = formatSeason(data.year, data.month);
    const calendar: CalendarInput[] = [];
    for (let i = 0; i < data.calendar.length; i++) {
      const row = data.calendar[i];
      for (const item of row) {
        calendar.push({
          subject_id: item.id,
          platform: 'tv',
          weekday: i
        });
      }
    }
    const categories = [
      ['web', data.web],
      ['korean', data.korean],
      ['short', data.short],
      ['motion', data.motion],
      ['adult', data.adult]
    ] as const;
    for (const [platform, items] of categories) {
      for (const item of items) {
        calendar.push({
          subject_id: item.id,
          platform,
          weekday: null
        });
      }
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
        for (const [, items] of categories) {
          for (const item of items) {
            if (item.id === -1) {
              throw new Error(`存在未知 subject ${item.name}`);
            }
            if (!allSubjects.has(item.id)) {
              missing.push(item.id);
            }
          }
        }
        for (const id of missing) {
          await fetchAndUpdateBangumiSubject(id, {
            baseURL: options.baseUrl,
            secret
          });
        }
      }

      await updateCalendar(
        {
          season,
          isActive: options.updateActive,
          calendar
        },
        { baseURL: options.baseUrl, secret }
      );
      consola.success('更新周历数据成功');
    }
  });

cli
  .command('calendar', {
    summary: '拉取当前周历数据',
    text: '查询番剧周历，按星期和播出平台展示条目，并支持导出 JSON 数据。',
    examples: [
      { command: 'bgmx calendar --season 2026-04 2026-07', comment: '查询多个季度' },
      {
        command: 'bgmx calendar --season 2026-04 --season 2026-07',
        comment: '重复选项也可累积季度'
      },
      { command: 'bgmx calendar --out calendar.json --full', comment: '导出完整条目数据' }
    ]
  })
  .option('--out <file>', '输出目标文件')
  .option('--version <version>', '输出文件版本号')
  .option('--full', '输出完整 subject 条目')
  .option('--season <...season>', '指定季度，支持多个值、重复选项或逗号分隔', {
    cast: z
      .array(z.string())
      .transform((values) =>
        values.flatMap((value) => value.split(',').map((season) => season.trim()))
      )
      .pipe(
        z.array(
          z
            .string()
            .regex(/^\d{4}-(01|04|07|10)$/, '季度格式应为 YYYY-01、YYYY-04、YYYY-07 或 YYYY-10')
        )
      )
  })
  .action(async (options) => {
    const resp = await fetchCalendar({
      baseURL: options.baseUrl,
      seasons: options.season
    });

    printCalendar(resp.calendar, resp.web, resp);

    if (options.out) {
      await dumpCalendar(options.out, resp.calendar, resp.web, {
        full: options.full,
        version: options.version,
        categories: resp
      });
    }
  });

cli
  .command('subject', {
    summary: '查询或管理 bgmx 条目',
    text: '查看条目当前生效的数据和已启用修订，或刷新、删除服务端条目。',
    examples: [
      {
        command: 'bgmx subject 328609',
        comment: '查看条目及生效修订'
      },
      {
        command: 'bgmx subject 328609 --post',
        comment: '使用 SECRET 环境变量中的密钥刷新条目'
      },
      {
        command: 'bgmx subject 328609 --delete',
        comment: '使用 SECRET 环境变量中的密钥删除条目'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .option('--post', '更新 bgmx 条目')
  .option('--delete', '删除 bgmx 条目及其关联数据')
  .action(async (subjectId, options) => {
    const secret = options.secret ?? process.env.SECRET;

    if (options.post && options.delete) {
      throw new Error('--post and --delete cannot be used together');
    }

    if (options.delete) {
      await deleteSubject(subjectId, {
        baseURL: options.baseUrl,
        secret
      });
      consola.success(`已删除 subject ${subjectId}`);
      return;
    }

    if (options.post) {
      const updated = await refreshSubject(subjectId, {
        baseURL: options.baseUrl,
        secret
      });
      printBangumiSubject(updated);
      return;
    }

    const resp = await fetchSubject(subjectId, {
      baseURL: options.baseUrl,
      secret
    });

    printSubject(resp);
  });

cli
  .command('subject revision', {
    summary: '交互式创建条目修订',
    text: '先显示条目当前数据，再通过交互提示编辑搜索关键词或时间范围等字段，完成后显示更新后的条目。',
    examples: [
      {
        command: 'bgmx subject revision 328609',
        comment: '使用 SECRET 环境变量中的密钥编辑搜索条件'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, options) => {
    const secret = options.secret ?? process.env.SECRET;

    const resp = await fetchSubject(subjectId, {
      baseURL: options.baseUrl,
      secret
    });

    if (resp) {
      printSubject(resp);
      console.log('');

      const updated = await createRevision(resp.subject, {
        baseURL: options.baseUrl,
        secret
      });

      if (updated) {
        printSubject(updated);
      }
    }
  });

cli
  .command('subject revision list', {
    summary: '查看条目的全部修订',
    text: '按条目 ID 查询修订记录，包括当前未启用的修订。可从输出中获取修订 ID，再使用 enable、disable 或 delete 管理对应记录。',
    examples: [
      {
        command: 'bgmx subject revision list 328609',
        comment: '列出条目的修订记录'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, options) => {
    const secret = options.secret ?? process.env.SECRET;

    const resp = await fetchRevisions(subjectId, {
      baseURL: options.baseUrl,
      secret
    });

    if (resp) {
      printSubject(resp);
    }
  });

cli
  .command('subject revision disable', {
    summary: '禁用条目修订',
    text: '停用一条修订，保留记录以便之后重新启用，完成后显示更新后的条目。',
    examples: [
      {
        command: 'bgmx subject revision disable 328609 1',
        comment: '停用修订 1，密钥从 SECRET 环境变量读取'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .argument('<revision_id>', '修订 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, revisionId, options) => {
    const secret = options.secret ?? process.env.SECRET;
    const updated = await disableRevision(subjectId, revisionId, {
      baseURL: options.baseUrl,
      secret
    });
    printSubject(updated);
  });

cli
  .command('subject revision enable', {
    summary: '启用条目修订',
    text: '启用一条修订，使其参与生成条目当前数据，完成后显示更新后的条目。',
    examples: [
      {
        command: 'bgmx subject revision enable 328609 1',
        comment: '启用修订 1，密钥从 SECRET 环境变量读取'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .argument('<revision_id>', '修订 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, revisionId, options) => {
    const secret = options.secret ?? process.env.SECRET;
    const updated = await enableRevision(subjectId, revisionId, {
      baseURL: options.baseUrl,
      secret
    });
    printSubject(updated);
  });

cli
  .command('subject revision delete', {
    summary: '删除条目修订',
    text: '永久删除一条修订，完成后显示更新后的条目。若只想暂停应用该修订，可使用 disable 保留记录。',
    examples: [
      {
        command: 'bgmx subject revision delete 328609 1',
        comment: '删除修订 1，密钥从 SECRET 环境变量读取'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .argument('<revision_id>', '修订 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, revisionId, options) => {
    const secret = options.secret ?? process.env.SECRET;
    const updated = await deleteRevision(subjectId, revisionId, {
      baseURL: options.baseUrl,
      secret
    });
    printSubject(updated);
  });

cli
  .command('garden', {
    summary: '查询条目对应的 AnimeGarden 资源',
    text: '读取条目当前的搜索条件，包括包含词、排除词、关键词及发布时间范围，再查询 AnimeGarden。逐行输出匹配资源的标题和发布时间。',
    examples: [
      {
        command: 'bgmx garden 328609',
        comment: '查询条目对应的资源'
      }
    ]
  })
  .argument('<subject_id>', '条目 ID', {
    cast: positiveInteger
  })
  .action(async (subjectId, options) => {
    const secret = options.secret ?? process.env.SECRET;

    const { subject } = await fetchSubject(subjectId, {
      baseURL: options.baseUrl,
      secret
    });

    const resp = await fetchResources({
      include: subject.search.include,
      exclude: subject.search.exclude,
      keywords: subject.search.keywords,
      after: subject.search.after ? new Date(subject.search.after) : undefined,
      before: subject.search.before ? new Date(subject.search.before) : undefined
    });

    for (const resource of resp.resources) {
      console.log(`${resource.title} ${formatDatetime(resource.createdAt)}`);
    }
  });

cli
  .command('bangumi subject', {
    summary: '刷新并查看 Bangumi 条目',
    text: '请求服务端刷新缓存中的 Bangumi 条目数据，并显示刷新结果。',
    examples: [
      {
        command: 'bgmx bangumi subject 328609',
        comment: '使用 SECRET 环境变量中的密钥刷新并查看条目'
      }
    ]
  })
  .argument('<subject_id>', 'Bangumi 条目 ID', { cast: positiveInteger })
  .option('--post', '刷新并更新服务端条目')
  .action(async (id, options) => {
    const secret = options.secret ?? process.env.SECRET;

    const resp = await fetchAndUpdateBangumiSubject(id, {
      baseURL: options.baseUrl,
      secret
    });

    printBangumiSubject(resp);
  });

if (process.stdin.isTTY) {
  consola.wrapConsole();
}

await cli.run(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof InputError) {
    for (const issue of error.issues) {
      const input =
        'option' in issue ? issue.option.spec : 'argument' in issue ? issue.argument.name : '';
      console.error(`${input ? `${input}: ` : ''}${issue.message}`);
    }
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
