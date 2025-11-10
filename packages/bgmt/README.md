# bgmt

[![version](https://img.shields.io/npm/v/bgmt?label=bgmt)](https://www.npmjs.com/package/bgmt)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

Shared bangumi helper functions used by [bgmx](https://github.com/yjl9903/bgmx).

## Installation

```bash
npm i bgmt
```

## Usage

### CDN

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

### Utilities

WIP

```ts
trimSeason('xxx 第二季')

// ...
```

## License

MIT License © 2024 [XLor](https://github.com/yjl9903)
