import { components, paths } from './types';

/** 条目 */
export namespace BGMSubject {
  export type Calendar =
    paths['/calendar']['get']['responses']['200']['content']['application/json'];

  export type GetSubjects =
    paths['/v0/subjects']['get']['responses']['200']['content']['application/json'];

  /** 实验性 API， 随时可能发生改动 */
  export type Search =
    paths['/v0/search/subjects']['post']['responses']['200']['content']['application/json'];

  export type Information =
    paths['/v0/subjects/{subject_id}']['get']['responses']['200']['content']['application/json'];

  export type Image = paths['/v0/subjects/{subject_id}/image']['get']['responses']['302'];

  export type Persons =
    paths['/v0/subjects/{subject_id}/persons']['get']['responses']['200']['content']['application/json'];

  export type Characters =
    paths['/v0/subjects/{subject_id}/characters']['get']['responses']['200']['content']['application/json'];

  export type RelatedSubjects =
    paths['/v0/subjects/{subject_id}/subjects']['get']['responses']['200']['content']['application/json'];
}

/** 章节 */
export namespace BGMEpisode {
  export type Episodes =
    paths['/v0/episodes']['get']['responses']['200']['content']['application/json'];

  export type EpisodeItem =
    paths['/v0/episodes/{episode_id}']['get']['responses']['200']['content']['application/json'];
}

/** 角色 */
export namespace BGMCharacter {
  export type Information =
    paths['/v0/characters/{character_id}']['get']['responses']['200']['content']['application/json'];

  export type Image = paths['/v0/characters/{character_id}/image']['get']['responses']['302'];

  export type Subjects =
    paths['/v0/characters/{character_id}/subjects']['get']['responses']['200']['content']['application/json'];

  export type Persons =
    paths['/v0/characters/{character_id}/persons']['get']['responses']['200']['content']['application/json'];
}

/** 人物 */
export namespace BGMPerson {
  export type Information =
    paths['/v0/persons/{person_id}']['get']['responses']['200']['content']['application/json'];

  export type Image = paths['/v0/persons/{person_id}/image']['get']['responses']['302'];

  export type Subjects =
    paths['/v0/persons/{person_id}/subjects']['get']['responses']['200']['content']['application/json'];

  export type Characters =
    paths['/v0/persons/{person_id}/characters']['get']['responses']['200']['content']['application/json'];
}

/** 用户 */
export namespace BGMUser {
  export type Information =
    paths['/v0/users/{username}']['get']['responses']['200']['content']['application/json'];

  export type Avatar = paths['/v0/users/{username}/avatar']['get']['responses']['302'];

  export type Me = paths['/v0/me']['get']['responses']['200']['content']['application/json'];
}

/** 收藏 */
export namespace BGMCollection {
  export type Information =
    paths['/v0/users/{username}/collections']['get']['responses']['200']['content']['application/json'];

  export type Subject =
    paths['/v0/users/{username}/collections/{subject_id}']['get']['responses']['200']['content']['application/json'];

  export type EpisodesInSubject =
    paths['/v0/users/-/collections/{subject_id}/episodes']['get']['responses']['200']['content']['application/json'];

  export type EpisodesInEpisodes =
    paths['/v0/users/-/collections/-/episodes/{episode_id}']['get']['responses']['200']['content']['application/json'];
}

/** 编辑历史 */
export namespace BGMEditHistory {
  export type Persons =
    paths['/v0/revisions/persons']['get']['responses']['200']['content']['application/json'];

  export type PersonRevision =
    paths['/v0/revisions/persons/{revision_id}']['get']['responses']['200']['content']['application/json'];

  export type Characters =
    paths['/v0/revisions/characters']['get']['responses']['200']['content']['application/json'];

  export type CharacterRevision =
    paths['/v0/revisions/characters/{revision_id}']['get']['responses']['200']['content']['application/json'];

  export type Subjects =
    paths['/v0/revisions/subjects']['get']['responses']['200']['content']['application/json'];

  export type SubjectRevision =
    paths['/v0/revisions/subjects/{revision_id}']['get']['responses']['200']['content']['application/json'];

  export type Episodes =
    paths['/v0/revisions/episodes']['get']['responses']['200']['content']['application/json'];

  export type EpisodeRevision =
    paths['/v0/revisions/episodes/{revision_id}']['get']['responses']['200']['content']['application/json'];
}

/** 目录 */
export namespace BGMCategory {
  export type Information =
    paths['/v0/indices/{index_id}']['get']['responses']['200']['content']['application/json'];

  export type Subjects = paths['/v0/indices/{index_id}/subjects']['get']['responses']['200'];

  export type Create =
    paths['/v0/indices']['post']['responses']['200']['content']['application/json'];

  export type Edit =
    paths['/v0/indices/{index_id}']['put']['responses']['200']['content']['application/json'];

  export type DeleteSubject =
    paths['/v0/indices/{index_id}/subjects/{subject_id}']['delete']['responses']['200'];

  export type Collect = paths['/v0/indices/{index_id}/collect']['post']['responses']['200'];

  export type DeleteCollect = paths['/v0/indices/{index_id}/collect']['delete']['responses']['200'];
}

export type { BGMCategory as BGMIndices };

/** 搜索 */
export namespace BGMSearch {
  export type Search =
    | {
        results?: number;
        list?: components['schemas']['Legacy_SubjectSmall'][];
      }
    | {
        results?: number;
        list?: components['schemas']['Legacy_SubjectMedium'][];
      }
    | {
        results?: number;
        list?: components['schemas']['Legacy_SubjectLarge'][];
      };
}
