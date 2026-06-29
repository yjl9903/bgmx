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

Use this section only for calendar update work: importing a yuc.wiki season, resolving Bangumi
subject ids, uploading the calendar, marking a season active, or cancelling an active season.

### Update And Activate A Calendar

1. Generate an initial yuc calendar session file in a draft directory without `.env`, so it cannot
   upload. Use an explicit session file name so it can be reviewed and edited:
   ```bash
   bgmx sync yuc \
     --year 2026 \
     --month 7 \
     --session yuc-2026-07.yaml
   ```
2. Read the generated session file. Find every calendar item whose `id` is missing or `-1`.
3. Infer missing Bangumi subject ids using the available tools:
   - Query bgmx subjects first when useful: `bgmx subject <subject_id>`.
   - Use `bgmc`/Bangumi search for candidate subjects.
   - Use web search when title aliases, season naming, or release metadata are ambiguous.
   - Prefer the exact seasonal subject, not the franchise/root subject.
4. Update the session file with resolved Bangumi subject ids.
5. Report the complete calendar before uploading. Include every animation in the season and its
   Bangumi subject id, grouped by weekday and web/ONA.
6. Wait for the user to confirm the reported calendar.
7. Upload the confirmed calendar and mark the season active:
   ```bash
   bgmx sync yuc \
     --year 2026 \
     --month 7 \
     --session yuc-2026-07.yaml \
     --update-server \
     --update-active true
   ```
8. Verify the uploaded season:
   ```bash
   bgmx calendar --season 2026-07
   ```

Calendar seasons use `yyyy-MM` where `MM` is `01`, `04`, `07`, or `10`. `sync yuc` derives this
season only from explicit `--year` and `--month`; it does not infer them from the session file name.
Always pass both flags when reading or uploading a session file.

### Cancel An Active Calendar

Use this when the user asks to deactivate a season without deleting its calendar data.

1. Confirm the target season:
   ```bash
   bgmx calendar --season 2026-07
   ```
2. Mark it inactive:
   ```bash
   bgmx sync yuc \
     --year 2026 \
     --month 7 \
     --session yuc-2026-07.yaml \
     --update-server \
     --update-active false
   ```
3. Verify active calendar state:
   ```bash
   bgmx calendar
   bgmx calendar --season 2026-07
   ```
