import { describe, it, expect } from 'vitest';

import { normalizeTags } from '../src/utils/tags';

describe('tags', () => {
  it.each([
    [['2025', '2025年', '10月', '2025年10月'], ['2025年10月']],
    [['10月', '2025', '2025年', '2025年10月'], ['2025年10月']],
    [['2025', '2025年', '2025年10月'], ['2025年10月']],
    [['2025', '2025年', '2025年10月', '2025秋'], ['2025年10月']],
    [['2022年01月', '2022年1月'], ['2022年1月']],
    [['2012年1月', '2012年1月番'], ['2012年1月']]
  ])('should normalize %o -> %o', (input: string[], expected: string[]) => {
    expect(normalizeTags(input.map((t) => ({ name: t, count: 1 })))).toEqual(expected);
  });

  it('should clean high confidence tag typos', () => {
    expect(
      normalizeTags(
        [
          'TV　',
          'TⅤ',
          '百合　',
          'MAPPA　',
          'Infinite　Stratos',
          '东方project',
          '手冢Production',
          '奇幻,',
          '搞笑,',
          '1992,',
          'A-Pictures',
          'MAD_HOUSE',
          'Mad-house',
          'Studio.DEEN',
          '治癒',
          '泡麵',
          '音楽',
          '总集编',
          "Children'sPlaygroundEntertainm",
          'ChildrensPlaygroundEntertainme',
          ',',
          '?'
        ].map((t) => ({ name: t, count: 1 }))
      )
    ).toEqual([
      '1992',
      'A-1Pictures',
      "Children'sPlaygroundEntertainment",
      'InfiniteStratos',
      'MADHouse',
      'MAPPA',
      'TV',
      'studiodeen',
      '东方Project',
      '奇幻',
      '总集篇',
      '手冢PRODUCTION',
      '搞笑',
      '治愈',
      '泡面',
      '百合',
      '音乐'
    ]);
  });

  it('should merge common studio variants', () => {
    expect(
      normalizeTags(
        [
          'Production.I.G',
          'ProductionI.G',
          'Production_I.G',
          '8-Bit',
          '8bit',
          'SILVERLINK.',
          'SILVER_LINK.',
          'SILVERLINK',
          'STUDIO_DEEN',
          'studiodeen',
          'A-1Pictures',
          'A-1_Pictures',
          'WITSTUDIO',
          'WIT_STUDIO',
          'davidproduction',
          'david_production',
          'KINEMACITRUS',
          'KINEMA_CITRUS'
        ].map((t) => ({ name: t, count: 1 }))
      )
    ).toEqual([
      '8bit',
      'A-1Pictures',
      'KINEMACITRUS',
      'ProductionI.G',
      'SILVERLINK',
      'WITSTUDIO',
      'davidproduction',
      'studiodeen'
    ]);
  });

  it('should split glued tags and remove obvious junk', () => {
    expect(
      normalizeTags(
        [
          'A-1Pictures,漫改,2023,韩漫,爽文',
          'OVA||OAD||特典',
          '这年头什么寄吧粪作都能有第二季,抄袭爽文更别提',
          '>▽<'
        ].map((t) => ({ name: t, count: 1 }))
      )
    ).toEqual(['2023', 'A-1Pictures', 'OAD', 'OVA', '漫改', '爽文', '特典', '韩漫']);
  });
});
