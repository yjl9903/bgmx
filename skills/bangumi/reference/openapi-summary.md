# Bangumi OpenAPI 接口总览

## 平台简介

Bangumi (`bgm.tv`) 是一个以动画、书籍、音乐、游戏、三次元作品为核心的条目与收藏平台，同时提供角色、人物、章节、目录和编辑历史等数据。`bgmc` 提供了这个 OpenAPI 的 TypeScript/CLI 封装。

## API 基本信息

- Base URL: `https://api.bgm.tv`
- 认证方式: Bearer Token
- Access Token 生成: `https://next.bgm.tv/demo/access-token`
- User-Agent: 建议显式传入；`bgmc` 默认会带 `bgmc/<version>` 的 UA

## 认证模型

- `OptionalHTTPBearer`: 可匿名访问，但部分敏感内容、NSFW 或私有收藏可能不可见。
- `HTTPBearer`: 必须提供 access token。

## 资源分组

### 条目

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `POST` | `/v0/search/subjects` | 条目搜索 | 可选 |
| `GET` | `/v0/subjects` | 浏览条目 | 可选 |
| `GET` | `/v0/subjects/{subject_id}` | 条目详情 | 可选 |
| `GET` | `/v0/subjects/{subject_id}/image` | 条目图片跳转 | 可选 |
| `GET` | `/v0/subjects/{subject_id}/persons` | 条目关联人物 | 可选 |
| `GET` | `/v0/subjects/{subject_id}/characters` | 条目关联角色 | 可选 |
| `GET` | `/v0/subjects/{subject_id}/subjects` | 条目关联条目 | 可选 |
| `GET` | `/calendar` | 每日放送 | 无 |

常用查询参数:

- `type`: 条目类型。
- `cat`: 子分类，按条目类型解释。
- `series`: 是否系列作品。
- `platform`: 游戏平台。
- `sort`: 排序，例如 `date`、`rank`。
- `year` / `month`: 按年月浏览。
- `limit` / `offset`: 分页。

### 章节

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `GET` | `/v0/episodes` | 章节列表 | 可选 |
| `GET` | `/v0/episodes/{episode_id}` | 单章详情 | 可选 |

常用查询参数:

- `subject_id`: 所属条目 ID。
- `type`: 章节类型。
- `limit` / `offset`: 分页。

### 角色

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `POST` | `/v0/search/characters` | 角色搜索 | 可选 |
| `GET` | `/v0/characters/{character_id}` | 角色详情 | 可选 |
| `GET` | `/v0/characters/{character_id}/image` | 角色图片跳转 | 可选 |
| `GET` | `/v0/characters/{character_id}/subjects` | 角色关联条目 | 可选 |
| `GET` | `/v0/characters/{character_id}/persons` | 角色关联人物 | 可选 |
| `POST` | `/v0/characters/{character_id}/collect` | 收藏角色 | 必需 |
| `DELETE` | `/v0/characters/{character_id}/collect` | 取消收藏角色 | 必需 |

### 人物

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `POST` | `/v0/search/persons` | 人物搜索 | 可选 |
| `GET` | `/v0/persons/{person_id}` | 人物详情 | 可选 |
| `GET` | `/v0/persons/{person_id}/image` | 人物图片跳转 | 可选 |
| `GET` | `/v0/persons/{person_id}/subjects` | 人物关联条目 | 可选 |
| `GET` | `/v0/persons/{person_id}/characters` | 人物关联角色 | 可选 |
| `POST` | `/v0/persons/{person_id}/collect` | 收藏人物 | 必需 |
| `DELETE` | `/v0/persons/{person_id}/collect` | 取消收藏人物 | 必需 |

### 用户

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `GET` | `/v0/users/{username}` | 用户详情 | 可选 |
| `GET` | `/v0/users/{username}/avatar` | 用户头像跳转 | 可选 |
| `GET` | `/v0/me` | 当前登录用户 | 必需 |

### 收藏

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `GET` | `/v0/users/{username}/collections` | 用户条目收藏列表 | 可选 |
| `GET` | `/v0/users/{username}/collections/{subject_id}` | 用户单条目收藏 | 可选 |
| `POST` | `/v0/users/-/collections/{subject_id}` | 新增或修改条目收藏 | 必需 |
| `PATCH` | `/v0/users/-/collections/{subject_id}` | 局部修改条目收藏 | 必需 |
| `GET` | `/v0/users/-/collections/{subject_id}/episodes` | 条目下章节收藏状态 | 必需 |
| `PATCH` | `/v0/users/-/collections/{subject_id}/episodes` | 批量修改章节收藏状态 | 必需 |
| `GET` | `/v0/users/-/collections/-/episodes/{episode_id}` | 单章节收藏状态 | 必需 |
| `PUT` | `/v0/users/-/collections/-/episodes/{episode_id}` | 更新单章节收藏状态 | 必需 |
| `GET` | `/v0/users/{username}/collections/-/characters` | 用户角色收藏列表 | 可选 |
| `GET` | `/v0/users/{username}/collections/-/characters/{character_id}` | 用户单角色收藏 | 可选 |
| `GET` | `/v0/users/{username}/collections/-/persons` | 用户人物收藏列表 | 可选 |
| `GET` | `/v0/users/{username}/collections/-/persons/{person_id}` | 用户单人物收藏 | 可选 |

收藏写接口的常见请求体:

- 条目收藏: `type`、`rate`、`ep_status`、`vol_status`、`comment`、`private`、`tags`
- 批量章节收藏: `episode_id` 数组和 `type`
- 单章节收藏: `type`

### 编辑历史

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `GET` | `/v0/revisions/persons` | 人物修订列表 | 无 |
| `GET` | `/v0/revisions/persons/{revision_id}` | 人物修订详情 | 无 |
| `GET` | `/v0/revisions/characters` | 角色修订列表 | 无 |
| `GET` | `/v0/revisions/characters/{revision_id}` | 角色修订详情 | 无 |
| `GET` | `/v0/revisions/subjects` | 条目修订列表 | 无 |
| `GET` | `/v0/revisions/subjects/{revision_id}` | 条目修订详情 | 无 |
| `GET` | `/v0/revisions/episodes` | 章节修订列表 | 无 |
| `GET` | `/v0/revisions/episodes/{revision_id}` | 章节修订详情 | 无 |

这些接口通常带:

- `person_id` / `character_id` / `subject_id` / `episode_id`
- `limit` / `offset`

### 目录

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `POST` | `/v0/indices` | 创建目录 | 必需 |
| `GET` | `/v0/indices/{index_id}` | 目录详情 | 可选 |
| `PUT` | `/v0/indices/{index_id}` | 修改目录基础信息 | 必需 |
| `GET` | `/v0/indices/{index_id}/subjects` | 目录条目列表 | 可选 |
| `POST` | `/v0/indices/{index_id}/subjects` | 向目录添加条目 | 必需 |
| `PUT` | `/v0/indices/{index_id}/subjects/{subject_id}` | 修改目录中条目信息 | 必需 |
| `DELETE` | `/v0/indices/{index_id}/subjects/{subject_id}` | 从目录删除条目 | 必需 |
| `POST` | `/v0/indices/{index_id}/collect` | 收藏目录 | 必需 |
| `DELETE` | `/v0/indices/{index_id}/collect` | 取消收藏目录 | 必需 |

目录写接口的请求体主要是:

- 目录基础信息: `title`、`description`
- 目录条目新增/编辑: `comment` 等目录内说明字段

## 常用枚举

### 条目类型 `SubjectType`

- `1`: 书籍
- `2`: 动画
- `3`: 音乐
- `4`: 游戏
- `6`: 三次元

### 条目子分类 `cat`

书籍:

- `0`: 其他
- `1001`: 漫画
- `1002`: 小说
- `1003`: 画集

动画:

- `0`: 其他
- `1`: TV
- `2`: OVA
- `3`: Movie
- `5`: WEB

游戏:

- `0`: 其他
- `4001`: 游戏
- `4002`: 软件
- `4003`: 扩展包
- `4005`: 桌游

三次元:

- `0`: 其他
- `1`: 日剧
- `2`: 欧美剧
- `3`: 华语剧
- `6001`: 电视剧
- `6002`: 电影
- `6003`: 演出
- `6004`: 综艺

### 章节类型 `EpType`

- `0`: MainStory
- `1`: SP
- `2`: OP
- `3`: ED
- `4`: PV
- `5`: MAD
- `6`: Other

### 条目收藏类型 `SubjectCollectionType`

- `1`: 想看 / 想读 / 想玩
- `2`: 看过 / 读过 / 玩过
- `3`: 在看 / 在读 / 在玩
- `4`: 搁置
- `5`: 抛弃

### 章节收藏类型 `EpisodeCollectionType`

- `0`: 未收藏
- `1`: 想看
- `2`: 看过
- `3`: 抛弃

### 图片尺寸参数

- 条目图片: `small`、`grid`、`large`、`medium`、`common`
- 角色图片: `small`、`grid`、`large`、`medium`
- 人物图片: `small`、`grid`、`large`、`medium`
- 用户头像: `small`、`medium`、`large`

## 实操建议

- 先看资源类型再选接口，不要直接翻完整 spec。
- 优先使用 `bgmc` CLI；只在需要精确 schema 或构造复杂请求体时打开 `openapi-v0.yaml`。
- 写操作先确认是否需要 access token。
- 带 `--filter` 和 `--body` 的 CLI 参数都必须传 JSON 对象字符串。
- 图片接口返回的是跳转头，不是图片二进制。
