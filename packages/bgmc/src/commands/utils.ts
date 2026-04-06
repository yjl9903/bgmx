export function parseNumber(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    throw new TypeError(`Expected number, got "${value}"`);
  }

  return number;
}

export function parseBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new TypeError(`Expected boolean, got "${value}"`);
}

export function parseJson(value: string | undefined, optionName: string) {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new TypeError(`Invalid JSON for ${optionName}`);
  }
}

export function parseJsonObject(value: string | undefined, optionName: string) {
  const parsed = parseJson(value, optionName);
  if (parsed === undefined) {
    return undefined;
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new TypeError(`${optionName} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}

export function requireOption<T>(value: T | undefined, optionName: string) {
  if (value === undefined) {
    throw new TypeError(`Missing required option: ${optionName}`);
  }

  return value;
}

export function toNumber(value: string, name: string) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    throw new TypeError(`Expected ${name} to be a number, got "${value}"`);
  }

  return number;
}

export function printJson(value: unknown) {
  console.log(JSON.stringify(value ?? null, null, 2));
}
