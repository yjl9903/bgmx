export type {
  Bangumi as DatabaseBangumi,
  Subject as DatabaseSubject,
  Calendar,
  CalendarSummary,
  CalendarInput,
  CalendarResult,
  CalendarSubject,
  CalendarUpdateInput,
  CalendarUpdateResult,
  Revision as DatabaseRevision,
  RevisionDetail
} from '../../../bgmw/src/schema/types';

export type FetchOptions = {
  /**
   * Fetch method
   */
  fetch?: typeof globalThis.fetch;

  /**
   * The base URL of bgmx API
   *
   * @default 'https://bgm.animes.garden/'
   */
  baseURL?: string;

  /**
   * The number of retry times
   *
   * @default 0
   */
  retry?: number;

  /**
   * Timeout for single request
   */
  timeout?: number;

  /**
   * Abort fetch signal
   */
  signal?: AbortSignal;

  /**
   * Secret key for API
   */
  secret?: string;

  /**
   * Hooks
   */
  hooks?: {
    prefetch?: (path: string, init: RequestInit) => Promise<void> | void;

    postfetch?: (path: string, init: RequestInit, response: Response) => Promise<void> | void;

    /**
     * Sleep 100ms by default
     */
    timeout?: () => Promise<void> | void;
  };
};
