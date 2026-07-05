import type { RelatedSubject, SubjectCharacters, SubjectInformation, SubjectPersons } from 'bgmc';

export type Bangumi = {
  id: number;
  data: SubjectInformation;
  persons: SubjectPersons;
  characters: SubjectCharacters;
  subjects: RelatedSubject[];
  updatedAt: Date;
};

export type Subject = {
  id: number;
  title: string;
  alias: SubjectAlias;
  poster: string;
  onair_date?: string | undefined | null;
  search: SubjectSearch;
  bangumi: SubjectBangumiData;
  tmdb: SubjectTmdbData | null;
  updatedAt: Date;
};

export type SubjectBangumiData = {
  id: SubjectInformation['id'];
  type: SubjectInformation['type'];
  name: string;
  name_cn: string;
  summary: string;
  date?: SubjectInformation['date'];
  platform: SubjectInformation['platform'];
  images: SubjectInformation['images'];
  eps: SubjectInformation['eps'];
  total_episodes: SubjectInformation['total_episodes'];
  meta_tags: SubjectInformation['meta_tags'];
  tags: string[];
  rating: {
    score: number;
    rank: number;
  };
};

export type SubjectTmdbData = unknown;

export type SubjectAlias = Partial<Record<'ja' | 'zh' | 'en', string[]>>;

export type SubjectSearch = {
  include: string[];
  exclude?: string[];
  keywords?: string[];
  after?: number;
  before?: number;
};

export type Calendar = {
  season: string;
  isActive: boolean;
};

export type CalendarRelation = {
  id: number;
  season: string;
  subjectId: number;
  platform: 'tv' | 'web';
  weekday: number | null;
};

export type CalendarInput = {
  subject_id: number;
  platform: 'tv' | 'web';
  weekday?: number | null;
};

export type CalendarUpdateInput = {
  season: string;
  isActive?: boolean;
  calendar?: CalendarInput[];
};

export type CalendarUpdateResult = {
  season: string;
  is_active: boolean;
  calendar: CalendarInput[];
};

export type CalendarSubject = Subject & {
  platform: 'tv' | 'web';
  weekday: number | undefined | null;
};

export type RevisionDetail =
  | {
      operation: 'set.add';
      path: string;
      value: string[];
    }
  | {
      operation: 'set.delete';
      path: string;
      value: string[];
    }
  | {
      operation: 'field.set';
      path: string;
      value: unknown;
    };

export type Revision = {
  id: number;
  targetId: number;
  detail: RevisionDetail;
  enabled: boolean;
  createdAt: Date;
};
