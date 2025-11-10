import { describe, it, expect } from 'vitest';

import { fetchBasicSubjects, fetchFullSubjects, fetchCalendarSubjects } from '../src/cdn/index';

describe('cdn', { timeout: 30 * 1000 }, () => {
  it('should fetch basic subjects', async () => {
    const { version, subjects } = await fetchBasicSubjects();
    expect(/0\.\d{8}\.\d+/.test(version)).toBeTruthy();
    expect(subjects).toBeInstanceOf(Array);
  });

  it('should fetch full subjects', async () => {
    const { version, subjects } = await fetchFullSubjects();
    expect(/0\.\d{8}\.\d+/.test(version)).toBeTruthy();
    expect(subjects).toBeInstanceOf(Array);
  });

  it('should fetch calendar subjects', async () => {
    const { version, calendar, web } = await fetchCalendarSubjects();
    expect(/0\.\d{8}\.\d+/.test(version)).toBeTruthy();
    expect(calendar).toBeInstanceOf(Array);
    expect(web).toBeInstanceOf(Array);
  });
});
