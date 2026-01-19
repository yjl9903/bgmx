import type { SubjectInformation } from 'bgmc';

export type SubjectData = {
  id: number;

  title: string;

  platform: SubjectInformation['platform'];

  onair_date?: string | undefined | null;

  alias: string[];

  rating: {
    score: number;
    rank: number;
  };

  summary: string;

  poster: string;

  images: SubjectImage[];

  tags: string[];
};

export type SubjectImage = {
  provider: 'bgm' | 'tmdb';
  quality: string;
  src: string;
};

export type SubjectSearch = {
  include: string[];
  exclude?: string[];
  keywords?: string[];
  after?: Date;
  before?: Date;
};
