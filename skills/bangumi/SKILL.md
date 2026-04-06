---
name: bangumi
description: Use this skill when the task is about Bangumi (bgm.tv) platform data or Bangumi OpenAPI, especially for querying subjects, episodes, characters, persons, users, collections, edit history, or indices.
---

# Bangumi

Bangumi (`bgm.tv`) is an ACG-centric cataloging and community platform. Its OpenAPI covers subject metadata, airing calendar, episodes, characters, persons, users, collections, edit history, and indices.

This skill is for tasks that need Bangumi data access or Bangumi OpenAPI operations. Prefer the published `bgmc` CLI over hand-written HTTP requests when it already covers the target endpoint.

## Use This Skill When

- The user asks for Bangumi OpenAPI usage, endpoint selection, or request examples.
- The user wants to query Bangumi subjects, episodes, characters, persons, users, collections, edit history, or indices.
- The user wants a `bgmc` CLI command for a Bangumi task.
- The user needs help constructing `--filter` or `--body` JSON payloads for Bangumi API calls.
- The user needs to understand Bangumi enums, auth requirements, image endpoints, or collection semantics.

## Workflow

1. Identify the resource type first: `subject`, `episode`, `character`, `person`, `user`, `collection`, `revision`, or `index`.
2. Check whether the operation is read-only or write/auth-sensitive.
3. Prefer `bgmc` CLI if the action exists there.
4. Read `reference/openapi-summary.md` when you need endpoint grouping, auth expectations, or enum shortcuts.
5. Read `reference/bgmc-cli.md` when you need exact CLI syntax, grouped commands, or examples.
6. Read `reference/openapi-v0.yaml` only when exact request/response schema, enum values, or request-body fields matter.

## Calling Conventions

- Check whether `bgmc` is already installed first: `command -v bgmc`.
- If installed, use `bgmc <command>`.
- If not installed, use `npx bgmc <command>` for one-off execution.
- Authentication can be passed with `--access-token <token>` or `BGM_ACCESS_TOKEN`.
- Override API host with `--base-url <url>` or `BGM_BASE_URL`.
- Override `User-Agent` with `--user-agent <value>` or `BGM_USER_AGENT`.
- Commands that accept `--filter` or `--body` require a JSON object string. In shell examples, wrap JSON in single quotes.
- Image endpoints return redirect metadata instead of binary image content; inspect the `Location`/`location` header in the JSON output.

## Common `bgmc` Commands

```bash
# 检查是否已安装
command -v bgmc

# 每日放送
npx bgmc calendar

# 搜索条目
npx bgmc search-subjects 孤独摇滚 --limit 10 --filter '{"type":[2],"tag":["音乐"]}'

# 浏览动画条目
npx bgmc subjects 2 --cat 1 --year 2024 --month 10 --sort rank --limit 20

# 获取条目详情 / 关联人物 / 关联角色
npx bgmc subject 443666
npx bgmc subject-persons 443666
npx bgmc subject-characters 443666

# 查询章节
npx bgmc episodes 443666 --type 0 --limit 20
npx bgmc episode 1234567

# 查询角色 / 人物
npx bgmc character 12345
npx bgmc person 6789

# 查询用户与收藏
npx bgmc user yjl9903
npx bgmc collections yjl9903 --subject-type 2 --type 3 --limit 20
npx bgmc collection yjl9903 443666

# 修改收藏
npx bgmc upsert-collection 443666 --access-token <token> --body '{"type":3,"rate":8,"comment":"补番中","tags":["校园","音乐"]}'
npx bgmc patch-collection-episodes 443666 --access-token <token> --body '{"episode_id":[1,2,3],"type":2}'
npx bgmc put-episode-collection 1234567 --access-token <token> --body '{"type":2}'

# 查询修订历史
npx bgmc subject-revisions 443666 --limit 10
npx bgmc subject-revision 999999

# 查询目录
npx bgmc index 1234
npx bgmc index-subjects 1234 --type 2 --limit 20
```

## Reference Files

- `reference/openapi-summary.md`: Bangumi OpenAPI overview, endpoint groups, auth model, and common enums.
- `reference/bgmc-cli.md`: `bgmc` command entrypoints, grouped command list, options, and examples.
- `reference/openapi-v0.yaml`: copied Bangumi OpenAPI spec for exact schema lookup.
