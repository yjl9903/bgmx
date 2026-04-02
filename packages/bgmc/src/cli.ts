import { breadc } from 'breadc';

import { version } from '../package.json';

import { BgmClient } from './client';

const cli = breadc('bgmc', { version });

const client = new BgmClient();

cli.command('subject <id>', 'Get Subject').action(async (id, _options) => {
  const subject = await client.subject(+id);
  console.log(subject);
});

cli.command('person <id>', 'Get Person').action(async (id, _options) => {
  const person = await client.person(+id);
  console.log(person);
});

cli
  .command('search <keywords>', 'Search Subject')
  .option('--type <number>', 'Subject type, 1 = book, 2 = anime, 3 = music, 4 = game, 6 = real')
  .action(async (keywords, options) => {
    const result = await client.search(keywords, {
      type: options.type ? (+options.type as 1) : undefined
    });
    console.log(result.list);
  });

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
