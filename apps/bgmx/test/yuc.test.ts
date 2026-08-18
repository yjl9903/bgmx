import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { parseYucPage } from '../src/commands/yuc/fetch';
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
    expect(data.korean).toEqual([]);
    expect(data.short).toEqual([]);
    expect(data.motion).toEqual([]);
    expect(data.adult).toEqual([]);
  });
});

describe('parseYucPage', () => {
  it('extracts the compact seasonal categories', () => {
    const html = `
      <div style="float:left"><div class="future_div">
        <p class="future_type_b">韩漫</p><p class="future_date">韩番</p>
        <img data-src="korean.jpg"></div><div><table><tr>
        <td class="future_title_">盗墓王</td></tr></table></div></div>
      <div style="float:left"><div class="future_div">
        <p class="future_type_b">子供</p><p class="future_date">泡面番</p>
        <img data-src="short.jpg"></div><div><table><tr>
        <td class="future_title_">爱上地球的阿奇</td></tr></table></div></div>
      <div style="float:left"><div class="future_div">
        <p class="future_type_b">漫改</p><p class="future_date">动态漫</p>
        <img data-src="motion.jpg"></div><div><table><tr>
        <td class="future_title__">北斗神拳</td></tr></table></div></div>
      <div style="float:left"><div class="future_div">
        <p class="future_type_b">漫改</p><p class="future_date">限制级</p>
        <img data-src="adult.jpg"></div><div><table><tr>
        <td class="future_title_">染谷同学</td></tr></table></div></div>
    `;

    const data = parseYucPage(html);

    expect(data.korean).toEqual([{ id: -1, name: '盗墓王', cover: 'korean.jpg', tags: ['韩漫'] }]);
    expect(data.short).toEqual([
      { id: -1, name: '爱上地球的阿奇', cover: 'short.jpg', tags: ['子供'] }
    ]);
    expect(data.motion).toEqual([
      { id: -1, name: '北斗神拳', cover: 'motion.jpg', tags: ['漫改'] }
    ]);
    expect(data.adult).toEqual([{ id: -1, name: '染谷同学', cover: 'adult.jpg', tags: ['漫改'] }]);
  });
});
