import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { fetchYucData } from '../src/commands/yuc/yuc';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await fs.remove(tempDir);
    tempDir = undefined;
  }
});

describe('fetchYucData', () => {
  it('infers year and month from the session filename', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bgmx-yuc-'));
    const session = path.join(tempDir, 'yuc202607.yaml');
    await fs.writeFile(session, 'year: 2026\nmonth: 7\nitems: []\ncalendar: []\nweb: []\n');

    const data = await fetchYucData({ session });

    expect(data.year).toBe(2026);
    expect(data.month).toBe(7);
  });
});
