# `bgmc` CLI 命令文档

## 命令入口

先检查是否已安装:

```bash
command -v bgmc
```

已安装时直接调用:

```bash
bgmc <command> [options]
```

未安装时使用一次性执行:

```bash
npx bgmc <command> [options]
```

## 全局参数

- `--access-token <token>`: Bangumi access token
- `--base-url <url>`: 覆盖 API 地址
- `--user-agent <value>`: 覆盖 `User-Agent`

环境变量回退:

- `BGM_ACCESS_TOKEN`
- `BGM_BASE_URL`
- `BGM_USER_AGENT`

## 参数约定

- 数字参数必须传数字字符串，例如 `443666`。
- 布尔参数必须是 `true` 或 `false`。
- `--filter` 和 `--body` 只接受 JSON 对象，不接受数组或普通字符串。
- CLI 输出统一为格式化 JSON。
- 图片相关命令返回的是跳转头信息，通常关注 `location` 或 `Location`。

## 搜索与条目

| 命令 | 用途 | 关键参数 |
| --- | --- | --- |
| `calendar` | 每日放送 | 无 |
| `search-subjects <keyword>` | 搜索条目 | `--limit` `--offset` `--filter` |
| `search-characters <keyword>` | 搜索角色 | `--limit` `--offset` `--filter` |
| `search-persons <keyword>` | 搜索人物 | `--limit` `--offset` `--filter` |
| `subjects <type>` | 浏览条目 | `--cat` `--series` `--platform` `--sort` `--year` `--month` `--limit` `--offset` |
| `subject <id>` | 条目详情 | 无 |
| `subject-image <id> <type>` | 条目图片跳转 | `type=small|grid|large|medium|common` |
| `subject-persons <id>` | 条目关联人物 | 无 |
| `subject-characters <id>` | 条目关联角色 | 无 |
| `subject-related <id>` | 条目关联条目 | 无 |

示例:

```bash
npx bgmc search-subjects 葬送的芙莉莲 --limit 10 --filter '{"type":[2],"air_date":["2023-09-29"]}'
npx bgmc subjects 2 --cat 1 --year 2025 --month 4 --sort rank --limit 20
npx bgmc subject 443666
npx bgmc subject-image 443666 large
```

`search-subjects --filter` 常见字段:

- `type`
- `tag`
- `air_date`
- `rating`
- `rating_count`
- `rank`
- `nsfw`

## 章节

| 命令 | 用途 | 关键参数 |
| --- | --- | --- |
| `episodes <subjectId>` | 章节列表 | `--type` `--limit` `--offset` |
| `episode <id>` | 单章详情 | 无 |

示例:

```bash
npx bgmc episodes 443666 --type 0 --limit 12
npx bgmc episode 1234567
```

## 角色

| 命令 | 用途 | 鉴权 |
| --- | --- | --- |
| `character <id>` | 角色详情 | 否 |
| `character-image <id> <type>` | 角色图片跳转 | 否 |
| `character-subjects <id>` | 角色关联条目 | 否 |
| `character-persons <id>` | 角色关联人物 | 否 |
| `collect-character <id>` | 收藏角色 | 是 |
| `uncollect-character <id>` | 取消收藏角色 | 是 |

示例:

```bash
npx bgmc character 12345
npx bgmc collect-character 12345 --access-token <token>
```

## 人物

| 命令 | 用途 | 鉴权 |
| --- | --- | --- |
| `person <id>` | 人物详情 | 否 |
| `person-image <id> <type>` | 人物图片跳转 | 否 |
| `person-subjects <id>` | 人物关联条目 | 否 |
| `person-characters <id>` | 人物关联角色 | 否 |
| `collect-person <id>` | 收藏人物 | 是 |
| `uncollect-person <id>` | 取消收藏人物 | 是 |

`search-persons --filter` 常见字段:

- `career`

## 用户与收藏

| 命令 | 用途 | 关键参数 / 请求体 | 鉴权 |
| --- | --- | --- | --- |
| `user <username>` | 用户详情 | 无 | 否 |
| `user-avatar <username> <type>` | 用户头像跳转 | `type=small|medium|large` | 否 |
| `me` | 当前用户信息 | 无 | 是 |
| `collections <username>` | 用户条目收藏列表 | `--subject-type` `--type` `--limit` `--offset` | 否 |
| `collection <username> <subjectId>` | 用户单条目收藏 | 无 | 否 |
| `upsert-collection <subjectId>` | 新增或修改条目收藏 | `--body <json>` | 是 |
| `patch-collection <subjectId>` | 局部修改条目收藏 | `--body <json>` | 是 |
| `collection-episodes <subjectId>` | 条目下章节收藏信息 | `--episode-type` `--limit` `--offset` | 是 |
| `patch-collection-episodes <subjectId>` | 批量修改章节收藏 | `--body <json>` | 是 |
| `episode-collection <episodeId>` | 单章节收藏信息 | 无 | 是 |
| `put-episode-collection <episodeId>` | 更新单章节收藏 | `--body <json>` | 是 |
| `user-character-collections <username>` | 用户角色收藏列表 | 无 | 否 |
| `user-character-collection <username> <characterId>` | 用户单角色收藏 | 无 | 否 |
| `user-person-collections <username>` | 用户人物收藏列表 | 无 | 否 |
| `user-person-collection <username> <personId>` | 用户单人物收藏 | 无 | 否 |

常用收藏请求体示例:

```bash
npx bgmc upsert-collection 443666 --access-token <token> \
  --body '{"type":3,"rate":8,"comment":"补番中","tags":["音乐","校园"],"private":false}'

npx bgmc patch-collection 443666 --access-token <token> \
  --body '{"rate":9,"comment":"补完"}'

npx bgmc patch-collection-episodes 443666 --access-token <token> \
  --body '{"episode_id":[1,2,3],"type":2}'

npx bgmc put-episode-collection 1234567 --access-token <token> \
  --body '{"type":2}'
```

条目收藏 `--body` 常见字段:

- `type`
- `rate`
- `ep_status`
- `vol_status`
- `comment`
- `private`
- `tags`

## 编辑历史

| 命令 | 用途 | 关键参数 |
| --- | --- | --- |
| `person-revisions <personId>` | 人物修订列表 | `--limit` `--offset` |
| `person-revision <id>` | 人物修订详情 | 无 |
| `character-revisions <characterId>` | 角色修订列表 | `--limit` `--offset` |
| `character-revision <id>` | 角色修订详情 | 无 |
| `subject-revisions <subjectId>` | 条目修订列表 | `--limit` `--offset` |
| `subject-revision <id>` | 条目修订详情 | 无 |
| `episode-revisions <episodeId>` | 章节修订列表 | `--limit` `--offset` |
| `episode-revision <id>` | 章节修订详情 | 无 |

示例:

```bash
npx bgmc subject-revisions 443666 --limit 10
npx bgmc subject-revision 999999
```

## 目录

| 命令 | 用途 | 关键参数 / 请求体 | 鉴权 |
| --- | --- | --- | --- |
| `create-index` | 创建目录 | 无 | 是 |
| `index <id>` | 目录详情 | 无 | 否 |
| `edit-index <id>` | 修改目录基础信息 | `--body <json>` | 是 |
| `index-subjects <id>` | 目录条目列表 | `--type` `--limit` `--offset` | 否 |
| `add-index-subject <id>` | 添加目录条目 | `--body <json>` | 是 |
| `edit-index-subject <indexId> <subjectId>` | 修改目录内条目说明 | `--body <json>` | 是 |
| `delete-index-subject <indexId> <subjectId>` | 删除目录条目 | 无 | 是 |
| `collect-index <id>` | 收藏目录 | 无 | 是 |
| `uncollect-index <id>` | 取消收藏目录 | 无 | 是 |

示例:

```bash
npx bgmc index 1234
npx bgmc index-subjects 1234 --type 2 --limit 20
npx bgmc edit-index 1234 --access-token <token> --body '{"title":"2025 春季动画","description":"追番目录"}'
npx bgmc add-index-subject 1234 --access-token <token> --body '{"subject_id":443666,"comment":"第一梯队"}'
```

## 选择命令的建议

- 查“有什么”: 用 `search-*`、`subjects`、`calendar`
- 查“某个具体对象”: 用 `subject`、`episode`、`character`、`person`、`user`、`index`
- 查“关联关系”: 用 `*-persons`、`*-characters`、`*-subjects`、`subject-related`
- 查“我或某人的收藏”: 用 `collections`、`collection-*`、`user-*-collections`
- 查“条目修订过程”: 用 `*-revisions`、`*-revision`
- 做写操作: 先确认 access token，再传 `--body`
