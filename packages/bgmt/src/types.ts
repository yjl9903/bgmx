type SubjectRating = {
  score: number;
  rank: number;
};

type SubjectAlias = Partial<Record<'ja' | 'zh' | 'en', string[]>>;

type SubjectSearch = {
  include: string[];

  after?: number | null | undefined;

  before?: number | null | undefined;
};

type BasicSubject = {
  id: number;

  title: string;

  alias: SubjectAlias;

  platform: string;

  onair_date?: string | null | undefined;

  rating?: SubjectRating | null | undefined;

  poster: string;

  tags: string[];

  search: SubjectSearch;
};

type FullSubject = BasicSubject & {
  summary: string;
};

declare const _version: string;

declare const _subjects: BasicSubject[];

declare const _default: {
  subjects: BasicSubject[];
};

export {
  SubjectRating,
  SubjectAlias,
  SubjectSearch,
  BasicSubject,
  FullSubject,
  _version as version,
  _subjects as subjects,
  _default as default
};
