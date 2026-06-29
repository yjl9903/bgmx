export async function retryFn<T>(
  fn: () => Promise<T>,
  count: number,
  signal?: AbortSignal
): Promise<T> {
  if (count < 0) {
    count = Number.MAX_SAFE_INTEGER;
  }
  let e: any;
  for (let i = 0; i <= count; i++) {
    try {
      return await fn();
    } catch (err) {
      e = err;
      if (signal?.aborted) {
        break;
      }
    }
  }
  throw e;
}

export function sleep(timeout?: number) {
  return new Promise<void>((res) => {
    setTimeout(() => res(), timeout);
  });
}

export function formatDatetime(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function formatSeason(year: number, month: number) {
  return `${year}-${('' + month).padStart(2, '0')}`;
}

export function parseBooleanOption(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`Invalid boolean option: ${value}`);
}

export function parseSeasonOption(value: unknown) {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}
