---
name: bgmx
description: Maintain bgmx project data workflows only when the user explicitly invokes $bgmx or explicitly asks Codex to maintain bgmx data. Covers syncing Bangumi subject data, manually creating Bangumi subject revisions, syncing yuc.wiki seasonal calendars, and switching the active online calendar season.
---

# bgmx

## Overview

Use this skill for routine bgmx data maintenance. Treat commands that include `--update-server`,
`--update-active`, `subject revision`, or direct bgmw HTTP writes as production-affecting unless the
user points at a local `--base-url`.

Use `bgmx ...` in examples. If `bgmx` is unavailable, use `npx --yes bgmx ...`.

## Workflow

1. Confirm the CLI is available:
   ```bash
   command -v bgmx >/dev/null 2>&1 && bgmx --version || npx --yes bgmx --version
   ```
2. Inspect current state before writing:
   - Identify the target API: production default `https://bgm.animes.garden/` or a local/dev
     `--base-url`.
   - For server updates, create or confirm a `.env` file in the current working directory with
     `SECRET=<value>`. Prefer `.env`; do not pass secrets directly on the command line.
3. Use read-only commands first when possible:
   - `bgmx subject <subject_id>`
   - `bgmx calendar --season <yyyy-MM>`
4. After writing, run the narrow verification command for the affected workflow and summarize the
   command output.

## Sync Bangumi Subjects

Use this when the user asks to refresh bgmx subject data from Bangumi.

- Pull and update all Bangumi subject data:
  ```bash
  bgmx sync bangumi --update-server
  ```
- Save fetched data without writing the server by running from a directory without `SECRET` in
  `.env`:
  ```bash
  bgmx sync bangumi
  ```
- Useful options:
  - `--out-dir <directory>` writes local Bangumi JSON data.
  - `--log <file>` records unknown subjects and update errors.
  - `--concurrency <number>` and `--retry <number>` control fetch behavior.

After syncing, inspect the log for unknown subjects and failures. If the user asks for a release or
PR, mention the sync count and any error count.

## Create Subject Revisions

Use revisions for manual corrections to a bgmx subject's search behavior. The CLI is interactive.

1. Inspect the subject:
   ```bash
   bgmx subject <subject_id>
   ```
2. Create a revision:
   ```bash
   bgmx subject revision <subject_id>
   ```
3. Choose one of the supported fields:
   - `search.include`
   - `search.exclude`
   - `search.keywords`
   - `search.before`
   - `search.after`
4. For set fields, choose `set.add`, `set.delete`, or `field.set`. For `before`/`after`, enter a
   parseable datetime.
5. Verify the result:
   ```bash
   bgmx subject revision list <subject_id>
   ```

Prefer small, targeted revisions. Do not edit database rows directly unless the user explicitly asks
for a migration or repair.

## Sync And Switch Calendar

Use this when the user asks to import yuc.wiki seasonal calendar data or switch the online active
calendar season.

- Sync a season from yuc.wiki and update that season's relations:
  ```bash
  bgmx sync yuc --year 2026 --month 7 --update-server
  ```
- Sync and mark the season active:
  ```bash
  bgmx sync yuc --year 2026 --month 7 --update-server --update-active true
  ```
- Sync and mark the season inactive:
  ```bash
  bgmx sync yuc --year 2026 --month 7 --update-server --update-active false
  ```
- Fetch a specific season:
  ```bash
  bgmx calendar --season 2026-07
  ```
- Fetch multiple seasons by repeating or comma-separating `--season` values if the CLI supports the
  form in use:
  ```bash
  bgmx calendar --season 2026-04,2026-07
  ```

Calendar seasons use `yyyy-MM` where `MM` is `01`, `04`, `07`, or `10`. `sync yuc` derives this
season from `--year` and `--month`. If `--update-active` is omitted, the command updates the
season's calendar relations without changing `is_active`.

When switching active online calendars, explicitly set the outgoing season inactive and the incoming
season active. The backend does not enforce a single active calendar.
