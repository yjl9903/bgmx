import { version } from '../package.json';

import type {
  Query,
  RequestBody,
  BGMCategory,
  BGMCategoryParams,
  BGMCharacter,
  BGMCharacterParams,
  BGMCollection,
  BGMCollectionParams,
  BGMEditHistory,
  BGMEditHistoryParams,
  BGMEpisode,
  BGMEpisodeParams,
  BGMPerson,
  BGMPersonParams,
  BGMSearch,
  BGMSearchParams,
  BGMSubject,
  BGMSubjectParams,
  BGMUser,
  BGMUserParams
} from './types';

import { BgmFetchError } from './error';

type QueryParams = Record<string, unknown> | null | undefined;

interface SendRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
  successStatus?: number | number[];
  redirect?: RequestRedirect;
}

function segment(value: string | number) {
  return encodeURIComponent(String(value));
}

function createHeaders(userAgent: string, accessToken?: string, body?: unknown) {
  const headers: Record<string, string> = {
    'User-Agent': userAgent
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function appendQuery(url: URL, query: QueryParams) {
  if (!query) {
    return;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          url.searchParams.append(key, String(item));
        }
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }
}

function headersToObject(headers: Headers) {
  const values: Record<string, unknown> = {};

  headers.forEach((value, key) => {
    values[key] = value;
    if (key === 'location') {
      values.Location = value;
    }
  });

  return values;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 302) {
    return {
      headers: headersToObject(response.headers)
    } as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
  }

  return {
    headers: headersToObject(response.headers)
  } as T;
}

export type Calendar = BGMSubject.Calendar;
export type SubjectSearch = BGMSubject.Search;
export type SubjectInformation = BGMSubject.Information;
export type SubjectImage = BGMSubject.Image;
export type SubjectPersons = BGMSubject.Persons;
export type SubjectCharacters = BGMSubject.Characters;
export type Subject = BGMSubject.RelatedSubjects[0];
export type RelatedSubject = BGMSubject.RelatedSubjects[0];

export type Episode = BGMEpisode.EpisodeItem;
export type Episodes = BGMEpisode.Episodes;

export type CharacterSearch = BGMCharacter.Search;
export type CharacterInformation = BGMCharacter.Information;
export type CharacterImage = BGMCharacter.Image;
export type CharacterSubjects = BGMCharacter.Subjects;
export type CharacterPersons = BGMCharacter.Persons;

export type PersonSearch = BGMPerson.Search;
export type PersonInformation = BGMPerson.Information;
export type PersonImage = BGMPerson.Image;
export type PersonSubjects = BGMPerson.Subjects;
export type PersonCharacters = BGMPerson.Characters;

export type UserInformation = BGMUser.Information;
export type UserAvatar = BGMUser.Avatar;
export type Me = BGMUser.Me;

export type Search = BGMSearch.Search;
export type CollectionInformation = BGMCollection.Information;
export type CollectionSubject = BGMCollection.Subject;
export type CharacterCollectionList = BGMCollection.Characters;
export type CharacterCollection = BGMCollection.Character;
export type PersonCollectionList = BGMCollection.Persons;
export type PersonCollection = BGMCollection.Person;
export type CollectionEpisodes = BGMCollection.EpisodesInSubject;
export type EpisodeCollection = BGMCollection.EpisodesInEpisodes;

export type PersonRevisionList = BGMEditHistory.Persons;
export type PersonRevision = BGMEditHistory.PersonRevision;
export type CharacterRevisionList = BGMEditHistory.Characters;
export type CharacterRevision = BGMEditHistory.CharacterRevision;
export type SubjectRevisionList = BGMEditHistory.Subjects;
export type SubjectRevision = BGMEditHistory.SubjectRevision;
export type EpisodeRevisionList = BGMEditHistory.Episodes;
export type EpisodeRevision = BGMEditHistory.EpisodeRevision;

export type IndexInformation = BGMCategory.Information;
export type IndexSubjects = BGMCategory.Subjects;
export type IndexCreate = BGMCategory.Create;
export type IndexEdit = BGMCategory.Edit;

export interface BgmClientInit {
  baseURL?: string;

  userAgent?: string;

  accessToken?: string;

  /**
   * @default 0
   */
  retry?: number;

  /**
   * @default 2000
   */
  retryTimeout?: number;

  fetch?: typeof globalThis.fetch;
}

export class BgmClient {
  public baseURL;

  public userAgent;

  public accessToken;

  private readonly fetch: typeof globalThis.fetch | null | undefined;

  private readonly init: BgmClientInit;

  public constructor(init: BgmClientInit = {}) {
    const { baseURL, userAgent, accessToken } = init;
    this.fetch = init.fetch;
    this.baseURL = baseURL || 'https://api.bgm.tv';
    this.userAgent = userAgent || `bgmc/${version} (https://www.npmjs.com/package/bgmc)`;
    this.accessToken = accessToken;
    this.init = { ...init };
  }

  public calendar() {
    return this.request<Calendar>('/calendar');
  }

  public subjects(query?: Query<BGMSubjectParams.Subjects>) {
    return this.request<BGMSubject.GetSubjects>('/v0/subjects', query);
  }

  public searchSubjects(params: BGMSubjectParams.Search) {
    return this.send<SubjectSearch>('/v0/search/subjects', {
      method: 'POST',
      query: params.query,
      body: params.requestBody
    });
  }

  public searchCharacters(params: BGMCharacterParams.Search) {
    return this.send<CharacterSearch>('/v0/search/characters', {
      method: 'POST',
      query: params.query,
      body: params.requestBody
    });
  }

  public searchPersons(params: BGMPersonParams.Search) {
    return this.send<PersonSearch>('/v0/search/persons', {
      method: 'POST',
      query: params.query,
      body: params.requestBody
    });
  }

  public subject(id: number) {
    return this.request<SubjectInformation>(`/v0/subjects/${segment(id)}`);
  }

  public subjectImage(id: number, query: Query<BGMSubjectParams.Image>) {
    return this.send<SubjectImage>(`/v0/subjects/${segment(id)}/image`, {
      query,
      successStatus: 302,
      redirect: 'manual'
    });
  }

  public subjectPersons(id: number) {
    return this.request<SubjectPersons>(`/v0/subjects/${segment(id)}/persons`);
  }

  public subjectCharacters(id: number) {
    return this.request<SubjectCharacters>(`/v0/subjects/${segment(id)}/characters`);
  }

  public subjectRelated(id: number) {
    return this.request<RelatedSubject[]>(`/v0/subjects/${segment(id)}/subjects`);
  }

  public episodes(query?: Query<BGMEpisodeParams.Episodes>) {
    return this.request<Episodes>('/v0/episodes', query);
  }

  public episode(id: number) {
    return this.request<Episode>(`/v0/episodes/${segment(id)}`);
  }

  public character(id: number) {
    return this.request<CharacterInformation>(`/v0/characters/${segment(id)}`);
  }

  public characterImage(id: number, query: Query<BGMCharacterParams.Image>) {
    return this.send<CharacterImage>(`/v0/characters/${segment(id)}/image`, {
      query,
      successStatus: 302,
      redirect: 'manual'
    });
  }

  public characterSubjects(id: number) {
    return this.request<CharacterSubjects>(`/v0/characters/${segment(id)}/subjects`);
  }

  public characterPersons(id: number) {
    return this.request<CharacterPersons>(`/v0/characters/${segment(id)}/persons`);
  }

  public collectCharacter(id: number) {
    return this.send<void>(`/v0/characters/${segment(id)}/collect`, {
      method: 'POST',
      successStatus: 204
    });
  }

  public uncollectCharacter(id: number) {
    return this.send<void>(`/v0/characters/${segment(id)}/collect`, {
      method: 'DELETE',
      successStatus: 204
    });
  }

  public person(id: number) {
    return this.request<PersonInformation>(`/v0/persons/${segment(id)}`);
  }

  public personImage(id: number, query: Query<BGMPersonParams.Image>) {
    return this.send<PersonImage>(`/v0/persons/${segment(id)}/image`, {
      query,
      successStatus: 302,
      redirect: 'manual'
    });
  }

  public personSubjects(id: number) {
    return this.request<PersonSubjects>(`/v0/persons/${segment(id)}/subjects`);
  }

  public personCharacters(id: number) {
    return this.request<PersonCharacters>(`/v0/persons/${segment(id)}/characters`);
  }

  public collectPerson(id: number) {
    return this.send<void>(`/v0/persons/${segment(id)}/collect`, {
      method: 'POST',
      successStatus: 204
    });
  }

  public uncollectPerson(id: number) {
    return this.send<void>(`/v0/persons/${segment(id)}/collect`, {
      method: 'DELETE',
      successStatus: 204
    });
  }

  public user(username: string) {
    return this.request<UserInformation>(`/v0/users/${segment(username)}`);
  }

  public userAvatar(username: string, query: Query<BGMUserParams.Avatar>) {
    return this.send<UserAvatar>(`/v0/users/${segment(username)}/avatar`, {
      query,
      successStatus: 302,
      redirect: 'manual'
    });
  }

  public me() {
    return this.request<Me>('/v0/me');
  }

  public search(keywords: string, query?: Query<BGMSearchParams.Search>) {
    return this.request<Search>(`/search/subject/${segment(keywords)}`, query);
  }

  public getCollections(username: string, query?: Query<BGMCollectionParams.Information>) {
    return this.request<CollectionInformation>(`/v0/users/${segment(username)}/collections`, query);
  }

  public getCollection(username: string, subjectId: number) {
    return this.request<CollectionSubject>(
      `/v0/users/${segment(username)}/collections/${segment(subjectId)}`
    );
  }

  public getCharacterCollections(username: string) {
    return this.request<CharacterCollectionList>(
      `/v0/users/${segment(username)}/collections/-/characters`
    );
  }

  public getCharacterCollection(username: string, characterId: number) {
    return this.request<CharacterCollection>(
      `/v0/users/${segment(username)}/collections/-/characters/${segment(characterId)}`
    );
  }

  public getPersonCollections(username: string) {
    return this.request<PersonCollectionList>(`/v0/users/${segment(username)}/collections/-/persons`);
  }

  public getPersonCollection(username: string, personId: number) {
    return this.request<PersonCollection>(
      `/v0/users/${segment(username)}/collections/-/persons/${segment(personId)}`
    );
  }

  public upsertCollection(
    subjectId: number,
    requestBody: RequestBody<BGMCollectionParams.PatchSubject>
  ) {
    return this.send<void>(`/v0/users/-/collections/${segment(subjectId)}`, {
      method: 'POST',
      body: requestBody,
      successStatus: 204
    });
  }

  public patchCollection(
    subjectId: number,
    requestBody: RequestBody<BGMCollectionParams.PatchSubject>
  ) {
    return this.send<void>(`/v0/users/-/collections/${segment(subjectId)}`, {
      method: 'PATCH',
      body: requestBody,
      successStatus: 204
    });
  }

  public getCollectionEpisodes(
    subjectId: number,
    query?: Query<BGMCollectionParams.EpisodesInSubject>
  ) {
    return this.request<CollectionEpisodes>(
      `/v0/users/-/collections/${segment(subjectId)}/episodes`,
      query
    );
  }

  public patchCollectionEpisodes(
    subjectId: number,
    requestBody: RequestBody<BGMCollectionParams.PatchEpisodesInSubject>
  ) {
    return this.send<void>(`/v0/users/-/collections/${segment(subjectId)}/episodes`, {
      method: 'PATCH',
      body: requestBody,
      successStatus: 204
    });
  }

  public getEpisodeCollection(episodeId: number) {
    return this.request<EpisodeCollection>(
      `/v0/users/-/collections/-/episodes/${segment(episodeId)}`
    );
  }

  public putEpisodeCollection(
    episodeId: number,
    requestBody: RequestBody<BGMCollectionParams.PutEpisodesInEpisodes>
  ) {
    return this.send<void>(`/v0/users/-/collections/-/episodes/${segment(episodeId)}`, {
      method: 'PUT',
      body: requestBody,
      successStatus: 204
    });
  }

  public personRevisions(query: Query<BGMEditHistoryParams.Persons>) {
    return this.request<PersonRevisionList>('/v0/revisions/persons', query);
  }

  public personRevision(id: number) {
    return this.request<PersonRevision>(`/v0/revisions/persons/${segment(id)}`);
  }

  public characterRevisions(query: Query<BGMEditHistoryParams.Characters>) {
    return this.request<CharacterRevisionList>('/v0/revisions/characters', query);
  }

  public characterRevision(id: number) {
    return this.request<CharacterRevision>(`/v0/revisions/characters/${segment(id)}`);
  }

  public subjectRevisions(query: Query<BGMEditHistoryParams.Subjects>) {
    return this.request<SubjectRevisionList>('/v0/revisions/subjects', query);
  }

  public subjectRevision(id: number) {
    return this.request<SubjectRevision>(`/v0/revisions/subjects/${segment(id)}`);
  }

  public episodeRevisions(query: Query<BGMEditHistoryParams.Episodes>) {
    return this.request<EpisodeRevisionList>('/v0/revisions/episodes', query);
  }

  public episodeRevision(id: number) {
    return this.request<EpisodeRevision>(`/v0/revisions/episodes/${segment(id)}`);
  }

  public createIndex() {
    return this.send<IndexCreate>('/v0/indices', {
      method: 'POST'
    });
  }

  public index(id: number) {
    return this.request<IndexInformation>(`/v0/indices/${segment(id)}`);
  }

  public editIndex(id: number, requestBody: RequestBody<BGMCategoryParams.PutIndices>) {
    return this.send<IndexEdit>(`/v0/indices/${segment(id)}`, {
      method: 'PUT',
      body: requestBody
    });
  }

  public indexSubjects(id: number, query?: Query<BGMCategoryParams.Subjects>) {
    return this.request<IndexSubjects>(`/v0/indices/${segment(id)}/subjects`, query);
  }

  public addIndexSubject(id: number, requestBody: RequestBody<BGMCategoryParams.AddSubjects>) {
    return this.send<void>(`/v0/indices/${segment(id)}/subjects`, {
      method: 'POST',
      body: requestBody
    });
  }

  public editIndexSubject(
    indexId: number,
    subjectId: number,
    requestBody: RequestBody<BGMCategoryParams.PutSubject>
  ) {
    return this.send<void>(`/v0/indices/${segment(indexId)}/subjects/${segment(subjectId)}`, {
      method: 'PUT',
      body: requestBody
    });
  }

  public deleteIndexSubject(indexId: number, subjectId: number) {
    return this.send<void>(`/v0/indices/${segment(indexId)}/subjects/${segment(subjectId)}`, {
      method: 'DELETE'
    });
  }

  public collectIndex(indexId: number) {
    return this.send<void>(`/v0/indices/${segment(indexId)}/collect`, {
      method: 'POST'
    });
  }

  public uncollectIndex(indexId: number) {
    return this.send<void>(`/v0/indices/${segment(indexId)}/collect`, {
      method: 'DELETE'
    });
  }

  public request<T>(pathname: string, query: Record<string, unknown> = {}) {
    return this.send<T>(pathname, { query });
  }

  private async send<T>(pathname: string, options: SendRequestOptions = {}): Promise<T> {
    const url = new URL(pathname, this.baseURL);
    appendQuery(url, options.query);

    const method = options.method || 'GET';
    const successStatus = Array.isArray(options.successStatus)
      ? options.successStatus
      : [options.successStatus ?? 200];

    const maxRetry = this.init.retry ?? 0;

    for (let i = 0; i <= maxRetry; i++) {
      try {
        const resp = await (this.fetch ?? fetch)(url.toString(), {
          method,
          headers: createHeaders(this.userAgent, this.accessToken, options.body),
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          redirect: options.redirect
        });

        if (!successStatus.includes(resp.status)) {
          throw new BgmFetchError(resp);
        }

        return await parseResponse<T>(resp);
      } catch (err) {
        if (err instanceof BgmFetchError) {
          if (err.response.status < 500) {
            throw err;
          }
        }

        if (i === maxRetry) {
          throw err;
        }

        if (this.init.retryTimeout) {
          await new Promise((resolve) => setTimeout(resolve, this.init.retryTimeout));
        }
      }
    }

    throw new Error('unreachable');
  }
}
