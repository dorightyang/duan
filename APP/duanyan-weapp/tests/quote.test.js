const {
  dayKey,
  excerpt,
  yearMonth,
  heroCopyText,
  heroIndexForDay,
  isHeroCandidate,
  textFingerprint,
  HERO_MIN_CHARS,
} = require('../miniprogram/utils/quote');

describe('今日一条的日期键', () => {
  test('按本地日期补零', () => {
    expect(dayKey(new Date(2026, 8, 26))).toBe('2026-09-26');
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('超长截断（excerpt）', () => {
  test('不超上限就原样返回，不动一个字', () => {
    expect(excerpt('做对的事情，把事情做对。', 20)).toEqual({ text: '做对的事情，把事情做对。', truncated: false });
    expect(excerpt('', 20)).toEqual({ text: '', truncated: false });
    expect(excerpt(null, 20)).toEqual({ text: '', truncated: false });
  });

  test('在句读处收尾，并补省略号', () => {
    const src = '第一句话说完了。第二句话还没说完但是太长了需要截断';
    const got = excerpt(src, 10);
    expect(got.truncated).toBe(true);
    expect(got.text).toBe('第一句话说完了。…');
    expect(src.startsWith(got.text.slice(0, -1))).toBe(true);
  });

  test('句读太靠前（不足预算六成）就硬切，免得只截出小半句', () => {
    const got = excerpt('好。后面是一大段没有任何标点的文字需要硬切处理', 10);
    expect(got.text).toBe('好。后面是一大段没有…');
  });

  test('没有标点就按字数硬切', () => {
    expect(excerpt('abcdefghijklmnop', 5).text).toBe('abcde…');
  });

  test('不把 `**` 加成对的加粗切断——落单的那个丢掉', () => {
    const got = excerpt('前面**加粗开始但没有收尾的正文继续写着', 12);
    expect(got.text.indexOf('**')).toBe(-1);
  });

  test('截断后不留尾随空白（含换行）', () => {
    const got = excerpt('第一行写完了。\n第二行开始然后被截断了', 8);
    expect(got.text.endsWith('…')).toBe(true);
    expect(got.text).not.toMatch(/\s…$/);
  });
});

describe('今天取清单里的第几条（heroIndexForDay）', () => {
  test('同一天同一清单稳定取同一条（不掺随机数，冷启动也一致）', () => {
    expect(heroIndexForDay(28, '2026-10-06')).toBe(heroIndexForDay(28, '2026-10-06'));
  });

  test('永远落在 [0, size) 内；一个月里不会天天都是同一条', () => {
    const seen = new Set();
    for (let d = 1; d <= 28; d += 1) {
      const i = heroIndexForDay(28, `2026-10-${String(d).padStart(2, '0')}`);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(28);
      seen.add(i);
    }
    expect(seen.size).toBeGreaterThan(8);
  });

  test('清单为空返回 -1（调用方给错误提示），不做取模兜底', () => {
    expect(heroIndexForDay(0, '2026-10-06')).toBe(-1);
    expect(heroIndexForDay(-5, '2026-10-06')).toBe(-1);
  });

  test('只有一条时永远取第 0 条', () => {
    expect(heroIndexForDay(1, '2026-10-06')).toBe(0);
  });
});

describe('出处日期 → 年.月（yearMonth）', () => {
  test('精确到日的补成「年.月」，月份补零', () => {
    expect(yearMonth('2017-05-10')).toBe('2017.05');
    expect(yearMonth('1999-08-01')).toBe('1999.08');
    expect(yearMonth('2017/5/10')).toBe('2017.05');
    expect(yearMonth('2017年5月')).toBe('2017.05');
  });

  test('只精确到年的如实给年，不补零到假的精度', () => {
    expect(yearMonth('2025')).toBe('2025');
  });

  test('没有年份的（空/未署名/只有月日）返回空串，不乱猜', () => {
    expect(yearMonth('')).toBe('');
    expect(yearMonth(null)).toBe('');
    expect(yearMonth(undefined)).toBe('');
    expect(yearMonth('未署名')).toBe('');
    expect(yearMonth('05-10')).toBe('');
  });
});

describe('长按复制的文本（heroCopyText）', () => {
  const row = { text: '做对的事情，把事情做对。', dateLabel: '1999-08-01', speakerLabel: '段永平', title: '段永平访谈' };

  test('完整版式：原文 + 空两行 + `—— 年.月 署名  《出处》`', () => {
    // 「空两行」= 原文与出处之间隔两个空行，即 \n\n\n。
    expect(heroCopyText(row)).toBe('做对的事情，把事情做对。\n\n\n—— 1999.08 段永平  《段永平访谈》');
  });

  test('null / 空文本 → 空串（调用方不提示「已复制」）', () => {
    expect(heroCopyText(null)).toBe('');
    expect(heroCopyText({})).toBe('');
    expect(heroCopyText({ text: '   ' })).toBe('');
    expect(heroCopyText({ text: '\n\t ' })).toBe('');
  });

  test('正文首尾空白会被裁掉，正文本身一字不改', () => {
    expect(heroCopyText({ text: '\n  原文一行。  \n', dateLabel: '2020', speakerLabel: '段永平' })).toBe('原文一行。\n\n\n—— 2020 段永平');
  });

  test('缺日期只写署名；缺署名只写日期；两者都缺只写标题', () => {
    expect(heroCopyText({ text: '话', speakerLabel: '段永平', title: '出处' })).toBe('话\n\n\n—— 段永平  《出处》');
    expect(heroCopyText({ text: '话', dateLabel: '2020', title: '出处' })).toBe('话\n\n\n—— 2020  《出处》');
    expect(heroCopyText({ text: '话', title: '出处' })).toBe('话\n\n\n—— 《出处》');
  });

  test('标题与正文相同就不重复（首页本来也不重复标题），标题缺失也不留空书名号', () => {
    expect(heroCopyText({ text: '做对的事情', dateLabel: '2020', speakerLabel: '段永平', title: '做对的事情' })).toBe(
      '做对的事情\n\n\n—— 2020 段永平',
    );
    expect(heroCopyText({ text: '做对的事情', dateLabel: '2020', speakerLabel: '段永平' })).toBe('做对的事情\n\n\n—— 2020 段永平');
  });

  test('什么出处都没有时只复制原文，不硬凑一行破折号', () => {
    expect(heroCopyText({ text: '只有一句话。' })).toBe('只有一句话。');
    expect(heroCopyText({ text: '只有一句话。', dateLabel: '', speakerLabel: '', title: '' })).toBe('只有一句话。');
  });

  test('超长被截断的正文（末尾省略号）也所见即所得地复制', () => {
    const cut = excerpt('第一句话说的是这个。'.repeat(30), 20);
    expect(cut.truncated).toBe(true);
    expect(heroCopyText({ text: cut.text, dateLabel: '2020', speakerLabel: '段永平' })).toBe(`${cut.text}\n\n\n—— 2020 段永平`);
  });
});

describe('正文指纹去重（textFingerprint）', () => {
  test('只差标点/空白/大小写的同一句话，指纹相同', () => {
    expect(textFingerprint('商业模式和企业文化。')).toBe(textFingerprint('商业模式和企业文化！'));
    expect(textFingerprint('  商业模式+企业文化  ')).toBe('商业模式企业文化');
    expect(textFingerprint('TSMC 的商业模式')).toBe(textFingerprint('tsmc的商业模式'));
  });

  test('只差连词（，vs 和）的**不算**同一句——这是文字层面的差异，指纹挡不住，如实留着', () => {
    expect(textFingerprint('商业模式，企业文化')).not.toBe(textFingerprint('商业模式和企业文化。'));
  });

  test('内容不同的句子指纹不同', () => {
    expect(textFingerprint('商业模式和企业文化。')).not.toBe(textFingerprint('企业文化指的就是“企业”的文化。'));
  });

  test('全标点/空的指纹是空串（调用方要有兜底，不能把它们全并成一条）', () => {
    expect(textFingerprint('')).toBe('');
    expect(textFingerprint('—— … ！')).toBe('');
    expect(textFingerprint(null)).toBe('');
  });
});

describe('离线选材的长度下限（isHeroCandidate，只给 tools/build-hero-list.mjs 用）', () => {
  test('短于下限的搜索命中残句不当候选', () => {
    expect(isHeroCandidate({ text: '商业模式和企业文化。' })).toBe(false);
    expect(isHeroCandidate({ text: '做对的事情！' })).toBe(false);
    expect(isHeroCandidate({ text: '甲'.repeat(HERO_MIN_CHARS - 1) })).toBe(false);
  });

  test('达到下限的进入候选（合格还要人工看上下文，长度只挡残句）', () => {
    expect(isHeroCandidate({ text: '甲'.repeat(HERO_MIN_CHARS) })).toBe(true);
    expect(isHeroCandidate({ text: '甲'.repeat(300) })).toBe(true);
  });

  test('空/缺字段不当候选（不会把 undefined 当成字符串）', () => {
    expect(isHeroCandidate(null)).toBe(false);
    expect(isHeroCandidate({})).toBe(false);
    expect(isHeroCandidate({ text: '' })).toBe(false);
    expect(isHeroCandidate({ text: '   ' })).toBe(false);
  });
});
