import { breadc, InputError } from 'breadc';

import { version } from '../package.json';

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

const cli = breadc('bgmc', {
  version,
  description: {
    text: 'Query Bangumi subjects, episodes, people and collections, or manage your collections and indexes. Results are printed as JSON.',
    examples: [
      {
        command: 'bgmc search-subjects "孤独摇滚" --limit 10',
        comment: 'Find subjects by keyword'
      },
      {
        command: 'bgmc subject 328609',
        comment: 'Show a subject'
      },
      {
        command: 'bgmc me',
        comment: 'Show the account for BGM_ACCESS_TOKEN'
      }
    ]
  },
  locale: 'en'
})
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

cli
  .command('calendar', {
    summary: 'Show the broadcast calendar',
    text: "Retrieve Bangumi's broadcast calendar grouped by weekday and print the response as JSON.",
    examples: [
      {
        command: 'bgmc calendar',
        comment: 'Show the current broadcast calendar'
      }
    ]
  })
  .action(async (options) => {
    const client = createClient(options);
    printJson(await client.calendar());
  });

cli
  .command('search-subjects <keyword>', {
    summary: 'Search subjects',
    text: 'Search Bangumi subjects by keyword and print the paginated JSON response.',
    examples: [
      {
        command: 'bgmc search-subjects "孤独摇滚" --limit 10 --offset 0',
        comment: 'Search the first page of results'
      }
    ]
  })
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
  .command('search-characters <keyword>', {
    summary: 'Search characters',
    text: 'Search Bangumi characters by keyword and print the paginated JSON response.',
    examples: [
      {
        command: 'bgmc search-characters "后藤一里" --limit 10 --offset 0',
        comment: 'Search the first page of results'
      }
    ]
  })
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
  .command('search-persons <keyword>', {
    summary: 'Search people',
    text: 'Search Bangumi people by keyword and print the paginated JSON response.',
    examples: [
      {
        command: 'bgmc search-persons "青山吉能" --limit 10 --offset 0',
        comment: 'Search the first page of results'
      }
    ]
  })
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
  .command('subjects <type>', {
    summary: 'Browse subjects',
    text: 'Browse the Bangumi catalog and print matching subjects as a paginated JSON response.',
    examples: [
      {
        command: 'bgmc subjects 2 --year 2026 --month 10 --sort rank --limit 20',
        comment: 'Browse anime released in October 2026'
      }
    ]
  })
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

cli
  .command('subject <id>', {
    summary: 'Show a subject',
    text: 'Retrieve a subject by its Bangumi ID and print its details as JSON, including names, description, infobox and rating information.',
    examples: [
      {
        command: 'bgmc subject 328609',
        comment: 'Show subject details'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.subject(toNumber(id, 'subject_id')));
  });

cli
  .command('subject-image <id> <type>', {
    summary: 'Get a subject image URL',
    text: 'Retrieve the redirect response for a subject cover. The JSON output includes a Location header containing the image URL.',
    examples: [
      {
        command: 'bgmc subject-image 328609 large',
        comment: 'Get the large cover URL'
      }
    ]
  })
  .action(async (id, type, options) => {
    const client = createClient(options);
    printJson(await client.subjectImage(toNumber(id, 'subject_id'), { type }));
  });

cli
  .command('subject-persons <id>', {
    summary: 'List people associated with a subject',
    text: 'Retrieve staff and other people linked to a subject, including their roles, and print the result as JSON.',
    examples: [
      {
        command: 'bgmc subject-persons 328609',
        comment: 'Show related entries'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.subjectPersons(toNumber(id, 'subject_id')));
  });

cli
  .command('subject-characters <id>', {
    summary: 'List characters in a subject',
    text: 'Retrieve characters linked to a subject by Bangumi subject ID and print the result as JSON.',
    examples: [
      {
        command: 'bgmc subject-characters 328609',
        comment: 'Show related entries'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.subjectCharacters(toNumber(id, 'subject_id')));
  });

cli
  .command('subject-related <id>', {
    summary: 'List related subjects',
    text: 'Retrieve related subjects and their relationships, such as sequels or adaptations, and print the result as JSON.',
    examples: [
      {
        command: 'bgmc subject-related 328609',
        comment: 'Show related entries'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.subjectRelated(toNumber(id, 'subject_id')));
  });

cli
  .command('episodes <subjectId>', {
    summary: 'List episodes in a subject',
    text: 'Retrieve episodes for a Bangumi subject and print the paginated JSON response.',
    examples: [
      {
        command: 'bgmc episodes 328609 --limit 20 --offset 0',
        comment: 'List the first page of episodes'
      }
    ]
  })
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

cli
  .command('episode <id>', {
    summary: 'Show an episode',
    text: 'Retrieve an episode and print its title, numbering, air date and other details as JSON.',
    examples: [
      {
        command: 'bgmc episode 1',
        comment: 'Show episode details'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.episode(toNumber(id, 'episode_id')));
  });

cli
  .command('character <id>', {
    summary: 'Show a character',
    text: 'Retrieve a Bangumi character by ID and print the profile, description and infobox as JSON.',
    examples: [
      {
        command: 'bgmc character 1',
        comment: 'Show profile details'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.character(toNumber(id, 'character_id')));
  });

cli
  .command('character-image <id> <type>', {
    summary: 'Get a character image URL',
    text: 'Retrieve the redirect response for a character image. The JSON output includes a Location header containing the image URL.',
    examples: [
      {
        command: 'bgmc character-image 1 large',
        comment: 'Get the large image URL'
      }
    ]
  })
  .action(async (id, type, options) => {
    const client = createClient(options);
    printJson(await client.characterImage(toNumber(id, 'character_id'), { type }));
  });

cli
  .command('character-subjects <id>', {
    summary: 'List subjects associated with a character',
    text: 'Retrieve subjects linked to a Bangumi character by ID and print the relationships as JSON.',
    examples: [
      {
        command: 'bgmc character-subjects 1',
        comment: 'Show related subjects'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.characterSubjects(toNumber(id, 'character_id')));
  });

cli
  .command('character-persons <id>', {
    summary: 'List people associated with a character',
    text: 'Retrieve people linked to a character, such as voice actors, and print their relationships as JSON.',
    examples: [
      {
        command: 'bgmc character-persons 1',
        comment: 'Show people linked to the character'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.characterPersons(toNumber(id, 'character_id')));
  });

cli
  .command('collect-character <id>', {
    summary: 'Collect a character',
    text: "Add a character to the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc collect-character 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.collectCharacter(toNumber(id, 'character_id')));
  });

cli
  .command('uncollect-character <id>', {
    summary: 'Uncollect a character',
    text: "Remove a character from the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc uncollect-character 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectCharacter(toNumber(id, 'character_id')));
  });

cli
  .command('person <id>', {
    summary: 'Show a person',
    text: 'Retrieve a Bangumi person by ID and print the profile, description and infobox as JSON.',
    examples: [
      {
        command: 'bgmc person 1',
        comment: 'Show profile details'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.person(toNumber(id, 'person_id')));
  });

cli
  .command('person-image <id> <type>', {
    summary: 'Get a person image URL',
    text: 'Retrieve the redirect response for a person image. The JSON output includes a Location header containing the image URL.',
    examples: [
      {
        command: 'bgmc person-image 1 large',
        comment: 'Get the large image URL'
      }
    ]
  })
  .action(async (id, type, options) => {
    const client = createClient(options);
    printJson(await client.personImage(toNumber(id, 'person_id'), { type }));
  });

cli
  .command('person-subjects <id>', {
    summary: 'List subjects associated with a person',
    text: 'Retrieve subjects linked to a Bangumi person by ID and print the relationships as JSON.',
    examples: [
      {
        command: 'bgmc person-subjects 1',
        comment: 'Show related subjects'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.personSubjects(toNumber(id, 'person_id')));
  });

cli
  .command('person-characters <id>', {
    summary: 'List characters associated with a person',
    text: 'Retrieve characters linked to a person, such as roles performed by a voice actor, and print the relationships as JSON.',
    examples: [
      {
        command: 'bgmc person-characters 1',
        comment: 'Show characters linked to the person'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.personCharacters(toNumber(id, 'person_id')));
  });

cli
  .command('collect-person <id>', {
    summary: 'Collect a person',
    text: "Add a person to the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc collect-person 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.collectPerson(toNumber(id, 'person_id')));
  });

cli
  .command('uncollect-person <id>', {
    summary: 'Uncollect a person',
    text: "Remove a person from the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc uncollect-person 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectPerson(toNumber(id, 'person_id')));
  });

cli
  .command('user <username>', {
    summary: 'Show a user profile',
    text: 'Retrieve a public Bangumi user profile and print it as JSON.',
    examples: [
      {
        command: 'bgmc user sai',
        comment: 'Show a public profile'
      }
    ]
  })
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(await client.user(username));
  });

cli
  .command('user-avatar <username> <type>', {
    summary: 'Get a user avatar URL',
    text: 'Retrieve the redirect response for a user avatar. The JSON output includes a Location header containing the avatar URL.',
    examples: [
      {
        command: 'bgmc user-avatar sai large',
        comment: 'Get the large avatar URL'
      }
    ]
  })
  .action(async (username, type, options) => {
    const client = createClient(options);
    printJson(await client.userAvatar(username, { type }));
  });

cli
  .command('me', {
    summary: 'Show the authenticated user',
    text: "Retrieve the authenticated user's profile and print it as JSON.",
    examples: [
      {
        command: 'bgmc me',
        comment: 'Show the account for BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (options) => {
    const client = createClient(options);
    printJson(await client.me());
  });

cli
  .command('collections <username>', {
    summary: "List a user's subject collections",
    text: "Retrieve a user's subject collections and print the paginated JSON response.",
    examples: [
      {
        command: 'bgmc collections sai --subject-type 2 --type 3 --limit 20',
        comment: 'List anime currently in progress'
      }
    ]
  })
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
  .command('collection <username> <subjectId>', {
    summary: "Show a user's subject collection",
    text: "Retrieve one user's collection record for a Bangumi subject, including collection status and recorded progress, and print it as JSON.",
    examples: [
      {
        command: 'bgmc collection sai 328609',
        comment: 'Show a subject collection record'
      }
    ]
  })
  .action(async (username, subjectId, options) => {
    const client = createClient(options);
    printJson(await client.getCollection(username, toNumber(subjectId, 'subject_id')));
  });

cli
  .command('upsert-collection <subjectId>', {
    summary: 'Create or update a subject collection',
    text: "Create or update the authenticated user's collection record for a subject, including its status, rating and comments.",
    examples: [
      {
        command: 'bgmc upsert-collection 328609 --body \'{"type":3}\'',
        comment: 'Mark the subject as in progress'
      }
    ]
  })
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
  .command('patch-collection <subjectId>', {
    summary: 'Update fields in a subject collection',
    text: "Update selected fields of the authenticated user's existing subject collection record.",
    examples: [
      {
        command: 'bgmc patch-collection 328609 --body \'{"rate":9}\'',
        comment: 'Update the rating for a collected subject'
      }
    ]
  })
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
  .command('collection-episodes <subjectId>', {
    summary: 'List episode collection progress',
    text: "Retrieve the authenticated user's episode collection records for a subject and print them as JSON.",
    examples: [
      {
        command: 'bgmc collection-episodes 328609 --limit 20',
        comment: 'Show episode progress for a collected subject'
      }
    ]
  })
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
  .command('patch-collection-episodes <subjectId>', {
    summary: 'Update several episode collection records',
    text: "Update the authenticated user's progress for several episodes within a collected subject in one request.",
    examples: [
      {
        command:
          'bgmc patch-collection-episodes 328609 --body \'{"episode_id":[12345,12346],"type":2}\'',
        comment: 'Replace the sample episode IDs with episodes from the subject'
      }
    ]
  })
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

cli
  .command('episode-collection <episodeId>', {
    summary: 'Show episode collection progress',
    text: "Retrieve the authenticated user's collection record for one episode and print it as JSON.",
    examples: [
      {
        command: 'bgmc episode-collection 1',
        comment: 'Show collection progress for an episode'
      }
    ]
  })
  .action(async (episodeId, options) => {
    const client = createClient(options);
    printJson(await client.getEpisodeCollection(toNumber(episodeId, 'episode_id')));
  });

cli
  .command('put-episode-collection <episodeId>', {
    summary: 'Set episode collection progress',
    text: "Set the authenticated user's collection status for one episode belonging to a collected subject.",
    examples: [
      {
        command: 'bgmc put-episode-collection 1 --body \'{"type":2}\'',
        comment: 'Mark an episode as watched'
      }
    ]
  })
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
  .command('user-character-collections <username>', {
    summary: "List a user's character collections",
    text: 'Retrieve character collections for a Bangumi username and print the response as JSON.',
    examples: [
      {
        command: 'bgmc user-character-collections sai',
        comment: 'List collected character entries'
      }
    ]
  })
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(await client.getCharacterCollections(username));
  });

cli
  .command('user-character-collection <username> <characterId>', {
    summary: "Show a user's character collection",
    text: "Retrieve a user's collection record for a character and print it as JSON.",
    examples: [
      {
        command: 'bgmc user-character-collection sai 1',
        comment: 'Show one collection record'
      }
    ]
  })
  .action(async (username, characterId, options) => {
    const client = createClient(options);
    printJson(await client.getCharacterCollection(username, toNumber(characterId, 'character_id')));
  });

cli
  .command('user-person-collections <username>', {
    summary: "List a user's person collections",
    text: 'Retrieve person collections for a Bangumi username and print the response as JSON.',
    examples: [
      {
        command: 'bgmc user-person-collections sai',
        comment: 'List collected person entries'
      }
    ]
  })
  .action(async (username, options) => {
    const client = createClient(options);
    printJson(await client.getPersonCollections(username));
  });

cli
  .command('user-person-collection <username> <personId>', {
    summary: "Show a user's person collection",
    text: "Retrieve a user's collection record for a person and print it as JSON.",
    examples: [
      {
        command: 'bgmc user-person-collection sai 1',
        comment: 'Show one collection record'
      }
    ]
  })
  .action(async (username, personId, options) => {
    const client = createClient(options);
    printJson(await client.getPersonCollection(username, toNumber(personId, 'person_id')));
  });

cli
  .command('person-revisions <personId>', {
    summary: 'List person revisions',
    text: 'Retrieve the edit history of a Bangumi person as paginated JSON. Each revision can be inspected with person-revision.',
    examples: [
      {
        command: 'bgmc person-revisions 1 --limit 10',
        comment: 'List recent revision records'
      }
    ]
  })
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

cli
  .command('person-revision <id>', {
    summary: 'Show a person revision',
    text: "Retrieve a single record from a Bangumi person's edit history and print it as JSON.",
    examples: [
      {
        command: 'bgmc person-revision 1',
        comment: 'Replace 1 with a revision ID from the history'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.personRevision(toNumber(id, 'revision_id')));
  });

cli
  .command('character-revisions <characterId>', {
    summary: 'List character revisions',
    text: 'Retrieve the edit history of a Bangumi character as paginated JSON. Each revision can be inspected with character-revision.',
    examples: [
      {
        command: 'bgmc character-revisions 1 --limit 10',
        comment: 'List recent revision records'
      }
    ]
  })
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

cli
  .command('character-revision <id>', {
    summary: 'Show a character revision',
    text: "Retrieve a single record from a Bangumi character's edit history and print it as JSON.",
    examples: [
      {
        command: 'bgmc character-revision 1',
        comment: 'Replace 1 with a revision ID from the history'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.characterRevision(toNumber(id, 'revision_id')));
  });

cli
  .command('subject-revisions <subjectId>', {
    summary: 'List subject revisions',
    text: 'Retrieve the edit history of a Bangumi subject as paginated JSON. Each revision can be inspected with subject-revision.',
    examples: [
      {
        command: 'bgmc subject-revisions 328609 --limit 10',
        comment: 'List recent revision records'
      }
    ]
  })
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

cli
  .command('subject-revision <id>', {
    summary: 'Show a subject revision',
    text: "Retrieve a single record from a Bangumi subject's edit history and print it as JSON.",
    examples: [
      {
        command: 'bgmc subject-revision 1',
        comment: 'Replace 1 with a revision ID from the history'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.subjectRevision(toNumber(id, 'revision_id')));
  });

cli
  .command('episode-revisions <episodeId>', {
    summary: 'List episode revisions',
    text: 'Retrieve the edit history of a Bangumi episode as paginated JSON. Each revision can be inspected with episode-revision.',
    examples: [
      {
        command: 'bgmc episode-revisions 1 --limit 10',
        comment: 'List recent revision records'
      }
    ]
  })
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

cli
  .command('episode-revision <id>', {
    summary: 'Show an episode revision',
    text: "Retrieve a single record from a Bangumi episode's edit history and print it as JSON.",
    examples: [
      {
        command: 'bgmc episode-revision 1',
        comment: 'Replace 1 with a revision ID from the history'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.episodeRevision(toNumber(id, 'revision_id')));
  });

cli
  .command('create-index', {
    summary: 'Create an index',
    text: 'Create an index for the authenticated user and print its metadata as JSON. The returned index ID can be used to edit the index and add subjects.',
    examples: [
      {
        command: 'bgmc create-index',
        comment: 'Create an index using BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (options) => {
    const client = createClient(options);
    printJson(await client.createIndex());
  });

cli
  .command('index <id>', {
    summary: 'Show an index',
    text: 'Retrieve an index by ID and print its metadata as JSON. Use index-subjects to list the subjects it contains.',
    examples: [
      {
        command: 'bgmc index 1',
        comment: 'Show index metadata'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.index(toNumber(id, 'index_id')));
  });

cli
  .command('edit-index <id>', {
    summary: 'Edit an index',
    text: 'Update the title or description of an index managed by the authenticated user.',
    examples: [
      {
        command: 'bgmc edit-index 1 --body \'{"title":"My anime list"}\'',
        comment: 'Set an index title'
      }
    ]
  })
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
  .command('index-subjects <id>', {
    summary: 'List subjects in an index',
    text: 'Retrieve subjects contained in an index and print the paginated JSON response.',
    examples: [
      {
        command: 'bgmc index-subjects 1 --type 2 --limit 20',
        comment: 'List anime in an index'
      }
    ]
  })
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
  .command('add-index-subject <id>', {
    summary: 'Add a subject to an index',
    text: 'Add a subject to an index managed by the authenticated user, with its position and comment.',
    examples: [
      {
        command: 'bgmc add-index-subject 1 --body \'{"subject_id":328609,"sort":1}\'',
        comment: 'Add a subject at the chosen position'
      }
    ]
  })
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
  .command('edit-index-subject <indexId> <subjectId>', {
    summary: 'Edit a subject entry in an index',
    text: 'Update the position or comment of a subject already in an index managed by the authenticated user.',
    examples: [
      {
        command: 'bgmc edit-index-subject 1 328609 --body \'{"sort":2,"comment":"Recommended"}\'',
        comment: 'Update the entry order and comment'
      }
    ]
  })
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
  .command('delete-index-subject <indexId> <subjectId>', {
    summary: 'Remove a subject from an index',
    text: 'Remove a subject entry from an index managed by the authenticated user. The Bangumi subject itself remains intact.',
    examples: [
      {
        command: 'bgmc delete-index-subject 1 328609',
        comment: 'Remove the subject from the index'
      }
    ]
  })
  .action(async (indexId, subjectId, options) => {
    const client = createClient(options);
    printJson(
      await client.deleteIndexSubject(
        toNumber(indexId, 'index_id'),
        toNumber(subjectId, 'subject_id')
      )
    );
  });

cli
  .command('collect-index <id>', {
    summary: 'Collect an index',
    text: "Add an index to the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc collect-index 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.collectIndex(toNumber(id, 'index_id')));
  });

cli
  .command('uncollect-index <id>', {
    summary: 'Uncollect an index',
    text: "Remove an index from the authenticated user's collection and print the API response as JSON.",
    examples: [
      {
        command: 'bgmc uncollect-index 1',
        comment: 'Use the token from BGM_ACCESS_TOKEN'
      }
    ]
  })
  .action(async (id, options) => {
    const client = createClient(options);
    printJson(await client.uncollectIndex(toNumber(id, 'index_id')));
  });

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
