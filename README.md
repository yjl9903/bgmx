# bgmx

[![version](https://img.shields.io/npm/v/bgmx?label=bgmx)](https://www.npmjs.com/package/bgmx)
[![version](https://img.shields.io/npm/v/bgmt?label=bgmt)](https://www.npmjs.com/package/bgmt)
[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)
[![version](https://img.shields.io/npm/v/tmdbc?label=tmdbc)](https://www.npmjs.com/package/tmdbc)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

- Bangumi data which is scraped from [Bangumi](https://bgm.tv/) and [TMDB](https://www.themoviedb.org/)
- TypeScript wrapper of [Bangumi API](https://bangumi.github.io/api/)
- TypeScript wrapper of [TMDB API](https://developer.themoviedb.org/docs/getting-started)

## Usage

### bgmd

[![version](https://img.shields.io/npm/v/bgmd?label=bgmd)](https://www.npmjs.com/package/bgmd)

Bangumi data which is scraped from [Bangumi](https://bgm.tv/) and [TMDB](https://www.themoviedb.org/).

```bash
npm i bgmd
```

It exports 3 bundled json file:

- `bgmd`: Basic information of all the scraped bangumi subject
- `bgmd/full`: Full information (with summary and more) of all the scraped bangumi subject
- `bgmd/calendar`: Basic information of the onair bangumis that was onairing at the time of package release

```ts
import basic from 'bgmd' with { type: 'json' };

import full from 'bgmd/full' with { type: 'json' };

import calendar from 'bgmd/calendar' with { type: 'json' };
```

If you don't want to download this large package, you can just use the following cdn to get the latest data, or use the helper functions in `bgmt/cdn`.

- `bgmd`: `https://unpkg.com/bgmd@0/dist/index.json`
- `bgmd/full`: `https://unpkg.com/bgmd@0/dist/full.json`
- `bgmd/calendar`: `https://unpkg.com/bgmd@0/dist/calendar.json`

### bgmt

[![version](https://img.shields.io/npm/v/bgmt?label=bgmt)](https://www.npmjs.com/package/bgmt)

Shared bangumi helper functions used by [bgmx](https://github.com/yjl9903/bgmx).

```bash
npm i bgmt
```

#### CDN

You can use the following APIs to fetch the latest bgmd data from cdn.

```ts
import { fetchBasicSubjects, fetchFullSubjects, fetchCalendarSubjects } from 'bgmt/cdn'

// https://unpkg.com/bgmd@0/dist/index.json
await fetchBasicSubjects()

// https://unpkg.com/bgmd@0/dist/full.json
await fetchFullSubjects()

// https://unpkg.com/bgmd@0/dist/calendar.json
await fetchCalendarSubjects()
```

#### Utilities

WIP

```ts
trimSeason('xxx 第二季')

// ...
```

### bgmc

[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)

JavaScript [Bangumi](https://bgm.tv) client bindings.

```bash
npm i bgmc
```

```ts
import { BgmClient } from 'bgmc';

const client = new BgmClient();
const calendar = await client.calendar();

console.log(calendar);
```

### tmdbc

[![version](https://img.shields.io/npm/v/tmdbc?label=tmdbc)](https://www.npmjs.com/package/tmdbc)

JavaScript [TMDB](https://www.themoviedb.org/) client bindings.

```bash
npm i tmdbc
```

```ts
import { TMDBClient } from 'tmdbc';

const client = new TMDBClient({ token: 'Your token' });
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
