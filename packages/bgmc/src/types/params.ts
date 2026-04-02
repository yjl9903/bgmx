import { components, paths } from './types';

type JsonRequestBody<T extends { requestBody?: unknown }> =
  NonNullable<T['requestBody']> extends {
    content: { 'application/json': infer TBody };
  }
    ? TBody
    : never;

/** 条目 */
export namespace BGMSubjectParams {
  /* ============ S - Search ============ */
  type SearchRequestBody = JsonRequestBody<paths['/v0/search/subjects']['post']>;

  type SearchQuery = paths['/v0/search/subjects']['post']['parameters']['query'];

  /** 实验性 API， 随时可能发生改动 */
  export type Search = {
    query: SearchQuery;
    requestBody: SearchRequestBody;
  };
  /* ============ E - Search ============ */

  export type Subjects = paths['/v0/subjects']['get']['parameters'];

  export type Information = paths['/v0/subjects/{subject_id}']['get']['parameters'];

  export type Image = paths['/v0/subjects/{subject_id}/image']['get']['parameters'];

  export type Persons = paths['/v0/subjects/{subject_id}/persons']['get']['parameters'];

  export type Characters = paths['/v0/subjects/{subject_id}/characters']['get']['parameters'];

  export type RelatedSubjects = paths['/v0/subjects/{subject_id}/subjects']['get']['parameters'];
}

/** 章节 */
export namespace BGMEpisodeParams {
  export type Episodes = paths['/v0/episodes']['get']['parameters'];

  export type EpisodeItem = paths['/v0/episodes/{episode_id}']['get']['parameters'];
}

/** 角色 */
export namespace BGMCharacterParams {
  export type Information = paths['/v0/characters/{character_id}']['get']['parameters'];

  export type Image = paths['/v0/characters/{character_id}/image']['get']['parameters'];

  export type Subjects = paths['/v0/characters/{character_id}/subjects']['get']['parameters'];

  export type Persons = paths['/v0/characters/{character_id}/persons']['get']['parameters'];
}

/** 人物 */
export namespace BGMPersonParams {
  export type Information = paths['/v0/persons/{person_id}']['get']['parameters'];

  export type Image = paths['/v0/persons/{person_id}/image']['get']['parameters'];

  export type Subject = paths['/v0/persons/{person_id}/subjects']['get']['parameters'];

  export type Characters = paths['/v0/persons/{person_id}/characters']['get']['parameters'];
}

/** 用户 */
export namespace BGMUserParams {
  export type Information = paths['/v0/users/{username}']['get']['parameters'];

  export type Avatar = paths['/v0/users/{username}/avatar']['get']['parameters'];
}

/** 收藏 */
export namespace BGMCollectionParams {
  export type Information = paths['/v0/users/{username}/collections']['get']['parameters'];

  export type Subject = paths['/v0/users/{username}/collections/{subject_id}']['get']['parameters'];

  /* ============ S - PatchSubject ============ */

  type PatchSubjectPath =
    paths['/v0/users/-/collections/{subject_id}']['patch']['parameters']['path'];

  type PatchSubjectRequestBody = JsonRequestBody<
    paths['/v0/users/-/collections/{subject_id}']['patch']
  >;

  export type PatchSubject = {
    path: PatchSubjectPath;
    requestBody: PatchSubjectRequestBody;
  };

  /* ============ E - PatchSubject ============ */

  export type EpisodesInSubject =
    paths['/v0/users/-/collections/{subject_id}/episodes']['get']['parameters'];

  /* ============ S - PatchEpisodesInSubject ============ */
  type PatchEpisodesInSubjectPath =
    paths['/v0/users/-/collections/{subject_id}/episodes']['patch']['parameters']['path'];

  type PatchEpisodesInSubjectRequestBody = JsonRequestBody<
    paths['/v0/users/-/collections/{subject_id}/episodes']['patch']
  >;

  export type PatchEpisodesInSubject = {
    path: PatchEpisodesInSubjectPath;
    requestBody: PatchEpisodesInSubjectRequestBody;
  };
  /* ============ E - PatchEpisodesInSubject ============ */

  export type EpisodesInEpisodes =
    paths['/v0/users/-/collections/-/episodes/{episode_id}']['get']['parameters'];

  /* ============ S - PutEpisodesInEpisodes ============ */
  type PutEpisodesInEpisodesPath =
    paths['/v0/users/-/collections/-/episodes/{episode_id}']['put']['parameters']['path'];

  type PutEpisodesInEpisodesRequestBody = JsonRequestBody<
    paths['/v0/users/-/collections/-/episodes/{episode_id}']['put']
  >;

  export type PutEpisodesInEpisodes = {
    path: PutEpisodesInEpisodesPath;
    requestBody: PutEpisodesInEpisodesRequestBody;
  };
  /* ============ E - PutEpisodesInEpisodes ============ */
}

/** 编辑历史 */
export namespace BGMEditHistoryParams {
  export type Persons = paths['/v0/revisions/persons']['get']['parameters'];

  export type PersonRevision = paths['/v0/revisions/persons/{revision_id}']['get']['parameters'];

  export type Characters = paths['/v0/revisions/characters']['get']['parameters'];

  export type CharacterRevision =
    paths['/v0/revisions/characters/{revision_id}']['get']['parameters'];

  export type Subjects = paths['/v0/revisions/subjects']['get']['parameters'];

  export type SubjectRevision = paths['/v0/revisions/subjects/{revision_id}']['get']['parameters'];

  export type Episodes = paths['/v0/revisions/episodes']['get']['parameters'];

  export type EpisodeRevision = paths['/v0/revisions/episodes/{revision_id}']['get']['parameters'];
}

/** 目录 */
export namespace BGMCategoryParams {
  export type Indices = paths['/v0/indices/{index_id}']['get']['parameters'];

  /* ============== S - PutIndices ================= */
  type PutIndicesPath = paths['/v0/indices/{index_id}']['put']['parameters']['path'];

  type PutIndicesRequestBody = JsonRequestBody<paths['/v0/indices/{index_id}']['put']>;

  export type PutIndices = {
    path: PutIndicesPath;
    requestBody: PutIndicesRequestBody;
  };
  /* ============== E - PutIndices ================= */

  export type Subjects = paths['/v0/indices/{index_id}/subjects']['get']['parameters'];

  /* ============== S - AddSubjects ================= */
  type AddSubjectsPath = paths['/v0/indices/{index_id}/subjects']['post']['parameters']['path'];

  type AddSubjectsRequestBody = JsonRequestBody<paths['/v0/indices/{index_id}/subjects']['post']>;

  export type AddSubjects = {
    path: AddSubjectsPath;
    requestBody: AddSubjectsRequestBody;
  };
  /* ============== E - AddSubjects ================= */

  /* ============== S - PutSubject ================= */
  type PutSubjectPath =
    paths['/v0/indices/{index_id}/subjects/{subject_id}']['put']['parameters']['path'];

  type PutSubjectRequestBody = JsonRequestBody<
    paths['/v0/indices/{index_id}/subjects/{subject_id}']['put']
  >;

  export type PutSubject = {
    path: PutSubjectPath;
    requestBody: PutSubjectRequestBody;
  };
  /* ============== E - PutSubject ================= */

  export type DeleteSubject =
    paths['/v0/indices/{index_id}/subjects/{subject_id}']['delete']['parameters'];

  export type Collect = paths['/v0/indices/{index_id}/collect']['post']['parameters'];

  export type DeleteCollect = paths['/v0/indices/{index_id}/collect']['delete']['parameters'];
}
export type { BGMCategoryParams as BGMIndicesParams };

/** 搜索 */
export namespace BGMSearchParams {
  export type Search = {
    path: {
      keywords: string;
    };
    query: {
      type?: components['schemas']['Legacy_SubjectType'];
      responseGroup?: 'small' | 'medium' | 'large';
      start?: number;
      max_results?: number;
    };
  };
}

type BGMParams = {
  path?: any;
  query?: any;
  requestBody?: any;
};

export type Path<T extends BGMParams> = T['path'][keyof T['path']];
export type Query<T extends BGMParams> = T['query'];
export type RequestBody<T extends BGMParams> = T['requestBody'];
