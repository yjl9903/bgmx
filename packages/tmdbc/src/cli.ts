import { breadc, InputError } from 'breadc';

import { version } from '../package.json';

const cli = breadc('tmdbc', { version });

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
