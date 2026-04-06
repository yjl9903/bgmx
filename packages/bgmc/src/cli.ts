import { breadc } from 'breadc';

import { version, description } from '../package.json';

import type { CliOptions } from './commands/types';

import { BgmClient } from './client';
import {
  parseBoolean,
  parseJsonObject,
  parseNumber,
  printJson,
  requireOption,
  toNumber
} from './commands/utils';

const cli = breadc('bgmc', { version, description, i18n: 'en' })
  .option('--access-token <token>', 'Bangumi access token')
  .option('--base-url <url>', 'Override Bangumi API base URL')
  .option('--user-agent <value>', 'Override User-Agent header');

function createClient(options: CliOptions) {
  return new BgmClient({
    accessToken: options.accessToken || process.env.BGM_ACCESS_TOKEN,
    baseURL: options.baseUrl || process.env.BGM_BASE_URL,
    userAgent: options.userAgent || process.env.BGM_USER_AGENT
  });
}

cli.command('calendar', '每日放送').action(async (options) => {
  const client = createClient(options);
  printJson(await client.calendar());
});

cli
  .command('search-subjects <keyword>', '条目搜索')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .option('--filter <json>', 'JSON filter payload', {
    cast: (value) => parseJsonObject(value, '--filter')
  })
  .action(async (keyword, options) => {
    const client = createClient(options);
    printJson(
      await client.searchSubjects({
        query: {
          limit: options.limit,
          offset: options.offset
        },
        requestBody: {
          keyword,
          ...(options.filter === undefined ? {} : { filter: options.filter })
        }
      } as Parameters<BgmClient['searchSubjects']>[0])
    );
  });

cli
  .command('search-characters <keyword>', '角色搜索')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .option('--filter <json>', 'JSON filter payload', {
    cast: (value) => parseJsonObject(value, '--filter')
  })
  .action(async (keyword, options) => {
    const client = createClient(options);
    printJson(
      await client.searchCharacters({
        query: {
          limit: options.limit,
          offset: options.offset
        },
        requestBody: {
          keyword,
          ...(options.filter === undefined ? {} : { filter: options.filter })
        }
      } as Parameters<BgmClient['searchCharacters']>[0])
    );
  });

cli
  .command('search-persons <keyword>', '人物搜索')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .option('--filter <json>', 'JSON filter payload', {
    cast: (value) => parseJsonObject(value, '--filter')
  })
  .action(async (keyword, options) => {
    const client = createClient(options);
    printJson(
      await client.searchPersons({
        query: {
          limit: options.limit,
          offset: options.offset
        },
        requestBody: {
          keyword,
          ...(options.filter === undefined ? {} : { filter: options.filter })
        }
      } as Parameters<BgmClient['searchPersons']>[0])
    );
  });

cli
  .command('subjects <type>', '浏览条目')
  .option('--cat <cat>', 'Subject category', { cast: parseNumber })
  .option('--series <boolean>', 'Whether the subject is a series', { cast: parseBoolean })
  .option('--platform <platform>', 'Game platform')
  .option('--sort <sort>', 'Sort order, e.g. date or rank')
  .option('--year <year>', 'Year', { cast: parseNumber })
  .option('--month <month>', 'Month', { cast: parseNumber })
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (type, options) => {
    const client = createClient(options);
    printJson(
      await client.subjects({
        type: toNumber(type, 'type'),
        cat: options.cat,
        series: options.series,
        platform: options.platform,
        sort: options.sort,
        year: options.year,
        month: options.month,
        limit: options.limit,
        offset: options.offset
      } as NonNullable<Parameters<BgmClient['subjects']>[0]>)
    );
  });

cli.command('subject <id>', '获取条目').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.subject(toNumber(id, 'subject_id')));
});

cli.command('subject-image <id> <type>', 'Get Subject Image').action(async (id, type, options) => {
  const client = createClient(options);
  printJson(await client.subjectImage(toNumber(id, 'subject_id'), { type }));
});

cli.command('subject-persons <id>', 'Get Subject Persons').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.subjectPersons(toNumber(id, 'subject_id')));
});

cli.command('subject-characters <id>', 'Get Subject Characters').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.subjectCharacters(toNumber(id, 'subject_id')));
});

cli.command('subject-related <id>', 'Get Subject Relations').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.subjectRelated(toNumber(id, 'subject_id')));
});

cli
  .command('episodes <subjectId>', 'Get Episodes')
  .option('--type <type>', 'Episode type', { cast: parseNumber })
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.episodes({
        subject_id: toNumber(subjectId, 'subject_id'),
        type: options.type,
        limit: options.limit,
        offset: options.offset
      } as NonNullable<Parameters<BgmClient['episodes']>[0]>)
    );
  });

cli.command('episode <id>', 'Get Episode').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.episode(toNumber(id, 'episode_id')));
});

cli.command('character <id>', 'Get Character Detail').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.character(toNumber(id, 'character_id')));
});

cli
  .command('character-image <id> <type>', 'Get Character Image')
  .action(async (id, type, options) => {
    const client = createClient(options);
    printJson(await client.characterImage(toNumber(id, 'character_id'), { type }));
  });

cli
  .command('character-subjects <id>', 'get character related subjects')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.characterSubjects(toNumber(id, 'character_id')));
  });

cli
  .command('character-persons <id>', 'get character related persons')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.characterPersons(toNumber(id, 'character_id')));
  });

cli
  .command('collect-character <id>', 'Collect character for current user')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.collectCharacter(toNumber(id, 'character_id')));
  });

cli
  .command('uncollect-character <id>', 'Uncollect character for current user')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectCharacter(toNumber(id, 'character_id')));
  });

cli.command('person <id>', 'Get Person').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.person(toNumber(id, 'person_id')));
});

cli.command('person-image <id> <type>', 'Get Person Image').action(async (id, type, options) => {
  const client = createClient(options);
  printJson(await client.personImage(toNumber(id, 'person_id'), { type }));
});

cli.command('person-subjects <id>', 'get person related subjects').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.personSubjects(toNumber(id, 'person_id')));
});

cli
  .command('person-characters <id>', 'get person related characters')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.personCharacters(toNumber(id, 'person_id')));
  });

cli
  .command('collect-person <id>', 'Collect person for current user')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.collectPerson(toNumber(id, 'person_id')));
  });

cli
  .command('uncollect-person <id>', 'Uncollect person for current user')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectPerson(toNumber(id, 'person_id')));
  });

cli.command('user <username>', 'Get User by name').action(async (username, options) => {
  const client = createClient(options);
  printJson(await client.user(username));
});

cli
  .command('user-avatar <username> <type>', 'Get User Avatar by name')
  .action(async (username, type, options) => {
    const client = createClient(options);
    printJson(await client.userAvatar(username, { type }));
  });

cli.command('me', 'Get User').action(async (options) => {
  const client = createClient(options);
  printJson(await client.me());
});

cli
  .command('collections <username>', '获取用户收藏')
  .option('--subject-type <subjectType>', 'Subject type', { cast: parseNumber })
  .option('--type <type>', 'Collection type', { cast: parseNumber })
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(
      await client.getCollections(username, {
        subject_type: options.subjectType,
        type: options.type,
        limit: options.limit,
        offset: options.offset
      } as NonNullable<Parameters<BgmClient['getCollections']>[1]>)
    );
  });

cli
  .command('collection <username> <subjectId>', '获取用户单个条目收藏')
  .action(async (username, subjectId, options) => {
    const client = createClient(options);
    printJson(await client.getCollection(username, toNumber(subjectId, 'subject_id')));
  });

cli
  .command('upsert-collection <subjectId>', '新增或修改用户单个条目收藏')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.upsertCollection(
        toNumber(subjectId, 'subject_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('patch-collection <subjectId>', '修改用户单个收藏')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.patchCollection(
        toNumber(subjectId, 'subject_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('collection-episodes <subjectId>', '章节收藏信息')
  .option('--episode-type <episodeType>', 'Episode type', { cast: parseNumber })
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.getCollectionEpisodes(toNumber(subjectId, 'subject_id'), {
        episode_type: options.episodeType,
        limit: options.limit,
        offset: options.offset
      } as NonNullable<Parameters<BgmClient['getCollectionEpisodes']>[1]>)
    );
  });

cli
  .command('patch-collection-episodes <subjectId>', '章节收藏信息')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.patchCollectionEpisodes(
        toNumber(subjectId, 'subject_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli.command('episode-collection <episodeId>', '章节收藏信息').action(async (episodeId, options) => {
  const client = createClient(options);
  printJson(await client.getEpisodeCollection(toNumber(episodeId, 'episode_id')));
});

cli
  .command('put-episode-collection <episodeId>', '更新章节收藏信息')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (episodeId, options) => {
    const client = createClient(options);
    printJson(
      await client.putEpisodeCollection(
        toNumber(episodeId, 'episode_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('user-character-collections <username>', '获取用户角色收藏列表')
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(await client.getCharacterCollections(username));
  });

cli
  .command('user-character-collection <username> <characterId>', '获取用户单个角色收藏信息')
  .action(async (username, characterId, options) => {
    const client = createClient(options);
    printJson(await client.getCharacterCollection(username, toNumber(characterId, 'character_id')));
  });

cli
  .command('user-person-collections <username>', '获取用户人物收藏列表')
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(await client.getPersonCollections(username));
  });

cli
  .command('user-person-collection <username> <personId>', '获取用户单个人物收藏信息')
  .action(async (username, personId, options) => {
    const client = createClient(options);
    printJson(await client.getPersonCollection(username, toNumber(personId, 'person_id')));
  });

cli
  .command('person-revisions <personId>', 'Get Person Revisions')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (personId, options) => {
    const client = createClient(options);
    printJson(
      await client.personRevisions({
        person_id: toNumber(personId, 'person_id'),
        limit: options.limit,
        offset: options.offset
      })
    );
  });

cli.command('person-revision <id>', 'Get Person Revision').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.personRevision(toNumber(id, 'revision_id')));
});

cli
  .command('character-revisions <characterId>', 'Get Character Revisions')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (characterId, options) => {
    const client = createClient(options);
    printJson(
      await client.characterRevisions({
        character_id: toNumber(characterId, 'character_id'),
        limit: options.limit,
        offset: options.offset
      })
    );
  });

cli.command('character-revision <id>', 'Get Character Revision').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.characterRevision(toNumber(id, 'revision_id')));
});

cli
  .command('subject-revisions <subjectId>', 'Get Subject Revisions')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.subjectRevisions({
        subject_id: toNumber(subjectId, 'subject_id'),
        limit: options.limit,
        offset: options.offset
      })
    );
  });

cli.command('subject-revision <id>', 'Get Subject Revision').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.subjectRevision(toNumber(id, 'revision_id')));
});

cli
  .command('episode-revisions <episodeId>', 'Get Episode Revisions')
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (episodeId, options) => {
    const client = createClient(options);
    printJson(
      await client.episodeRevisions({
        episode_id: toNumber(episodeId, 'episode_id'),
        limit: options.limit,
        offset: options.offset
      })
    );
  });

cli.command('episode-revision <id>', 'Get Episode Revision').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.episodeRevision(toNumber(id, 'revision_id')));
});

cli.command('create-index', 'Create a new index').action(async (options) => {
  const client = createClient(options);
  printJson(await client.createIndex());
});

cli.command('index <id>', 'Get Index By ID').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.index(toNumber(id, 'index_id')));
});

cli
  .command('edit-index <id>', "Edit index's information")
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(
      await client.editIndex(
        toNumber(id, 'index_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('index-subjects <id>', 'Get Index Subjects')
  .option('--type <type>', 'Subject type', { cast: parseNumber })
  .option('--limit <limit>', 'Page size', { cast: parseNumber })
  .option('--offset <offset>', 'Page offset', { cast: parseNumber })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(
      await client.indexSubjects(toNumber(id, 'index_id'), {
        type: options.type,
        limit: options.limit,
        offset: options.offset
      } as NonNullable<Parameters<BgmClient['indexSubjects']>[1]>)
    );
  });

cli
  .command('add-index-subject <id>', 'Add a subject to Index')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(
      await client.addIndexSubject(
        toNumber(id, 'index_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('edit-index-subject <indexId> <subjectId>', 'Edit subject information in a index')
  .option('--body <json>', 'JSON request body', {
    cast: (value) => parseJsonObject(value, '--body')
  })
  .action(async (indexId, subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.editIndexSubject(
        toNumber(indexId, 'index_id'),
        toNumber(subjectId, 'subject_id'),
        requireOption(options.body, '--body') as never
      )
    );
  });

cli
  .command('delete-index-subject <indexId> <subjectId>', 'Delete a subject from a Index')
  .action(async (indexId, subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.deleteIndexSubject(
        toNumber(indexId, 'index_id'),
        toNumber(subjectId, 'subject_id')
      )
    );
  });

cli.command('collect-index <id>', 'Collect index for current user').action(async (id, options) => {
  const client = createClient(options);
  printJson(await client.collectIndex(toNumber(id, 'index_id')));
});

cli
  .command('uncollect-index <id>', 'Uncollect index for current user')
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectIndex(toNumber(id, 'index_id')));
  });

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
