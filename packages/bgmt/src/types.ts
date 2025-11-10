export type SubjectRating = {
  score: number;
  rank: number;
};

export type SubjectImage = {
  provider: 'bgm' | 'tmdb';
  quality: string;
  src: string;
};

export type SubjectSearch = {
  include: string[];

  exclude?: string[] | null | undefined;
};

export type BasicSubject = {
  id: number;

  title: string;

  platform: string;

  onair_date?: string | null | undefined;

  rating: SubjectRating;

  poster: string;

  tags: string[];

  search: SubjectSearch;
};

export type FullSubject = BasicSubject & {
  summary: string;

  alias: string[];

  images: SubjectImage[];
};
