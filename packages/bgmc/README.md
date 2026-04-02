# bgmc

[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

JavaScript [Bangumi](https://bgm.tv) client bindings.

## Installation

```bash
npm i bgmc
```

## Usage

Create the bangumi API client, and fetch something.

```ts
import { BgmClient } from 'bgmc';

const client = new BgmClient();
const calendar = await client.calendar();

console.log(calendar);
```

See full [Bangumi API docs](https://bangumi.github.io/api/).

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
