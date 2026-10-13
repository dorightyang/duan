const { collapseDuplicates, toResult, toBlock, toQuestion, questionLabel, docLevelDefects, toTopicItem, toRuns, parseInline, trimEdges, keywordRuns, sourceName, matchName, timecode, topperVisible, TOPPER_SHOW_AT_PX, isArticleDoc, isDatePrecisionNote, stripDatePrecisionNotes, titleRepeatedInBlocks } = require('../miniprogram/utils/view');

describe('view 映射', () => {
  test('toResult 用 highlight_runs，不拼 HTML', () => {
    const row = toResult({
      passage_id: 'p1',
      doc_id: 'd1',
      segment_id: 's1',
      text: '本分是不做不对的事',
      match_kind: 'literal',
      speaker: { person_id: 'duan_yongping', label: '段永平' },
      source: { source_type: 'netease_blog', date_label: '2010-03-24', source_tier: 'primary', title: '本分和平常心' },
      highlight_runs: [
        { text: '本分', highlight: true },
        { text: '是不做不对的事', highlight: false },
      ],
      warnings: ['转录未经逐字校对'],
    });
    expect(row.speakerLabel).toBe('段永平');
    expect(row.matchLabel).toBe('逐字命中');
    // 一手是默认，不再标；出处只剩「来源 · 日期」
    expect(row.sourceLine).toBe('网易博客 · 2010-03-24');
    expect(row.tierLabel).toBe('');
    expect(row.runs).toHaveLength(2);
    expect(row.runs[0].highlight).toBe(true);
    expect(row.warnings).toHaveLength(1);
  });

  test('二手要标出来，一手不标', () => {
    const second = toResult({
      passage_id: 'p2',
      doc_id: 'd2',
      text: '据他回忆',
      speaker: { label: '记者' },
      source: { source_type: 'article', date_label: '2016', source_tier: 'secondary' },
    });
    expect(second.tierLabel).toBe('二手');
    expect(second.sourceLine).toBe('文章 · 2016 · 二手');

    const topic = toTopicItem({ order: 1, segment_id: 's', doc_id: 'd', text: 'x', source_tier: 'secondary', date_label: '2016' });
    expect(topic.sourceLine).toBe('二手 · 2016');
  });

  test('toResult 缺 highlight_runs 时退回整段文本', () => {
    const row = toResult({ passage_id: 'p', doc_id: 'd', text: '原文' });
    expect(row.runs).toEqual([{ text: '原文', bold: false, highlight: false }]);
    expect(row.speakerLabel).toBe('未署名');
  });

  test('toBlock 区分本人段落与上下文', () => {
    const owner = toBlock({ block_id: 'b1', segment_id: 's1', order: 0, text: 'x', storage_scope: 'corpus', speaker: { person_id: 'duan_yongping', name: '段永平' }, timecode_ms: 27000 });
    expect(owner.isOwner).toBe(true);
    expect(owner.isContext).toBe(false);
    expect(owner.speakerLabel).toBe('段永平');
    expect(owner.timeLabel).toBe('00:27');

    const ctx = toBlock({ block_id: 'b2', segment_id: 's2', order: 1, text: 'y', storage_scope: 'context', speaker: { label: '主持人' } });
    expect(ctx.isContext).toBe(true);
    expect(ctx.speakerLabel).toBe('主持人');
    expect(ctx.timeLabel).toBe('');
  });

  test('docLevelDefects 只把「每段都带」的缺陷提为文档级', () => {
    const toc = [
      { defects: ['转录未经逐字校对', '说话人未识别'] },
      { defects: ['转录未经逐字校对', '说话人未识别'] },
    ];
    expect(docLevelDefects(toc)).toEqual(['转录未经逐字校对', '说话人未识别']);
    // 只要有一段没带，就不算文档级——不能把单段的问题提到页首
    expect(docLevelDefects([{ defects: ['转录未经逐字校对', '说话人未识别'] }, { defects: ['转录未经逐字校对'] }])).toEqual(['转录未经逐字校对']);
    expect(docLevelDefects([{ defects: ['转录未经逐字校对'] }, { defects: [] }])).toEqual([]);
    expect(docLevelDefects([])).toEqual([]);
    expect(docLevelDefects(undefined)).toEqual([]);
  });

  test('toBlock 不重复渲染页首已提示的文档级缺陷', () => {
    const block = { block_id: 'b1', segment_id: 's1', order: 0, text: 'x', storage_scope: 'corpus', defects: ['转录未经逐字校对', '说话人未识别'] };
    expect(toBlock(block, ['转录未经逐字校对']).defects).toEqual(['说话人未识别']);
    expect(toBlock(block).defects).toEqual(['转录未经逐字校对', '说话人未识别']);
  });

  test('搜索结果卡带上「他在回答什么」：提问弱一档，且分清是谁说的', () => {
    const row = toResult({
      passage_id: 'p1',
      doc_id: 'd1',
      segment_id: 's1',
      text: '他确实非常聪明和厉害。',
      speaker: { label: '段永平' },
      source: { source_type: 'xueqiu', date_label: '2024-10-12' },
      question: { segment_id: 'q1', text: '马斯克智商很高，好像包容性差点', speaker_person_id: null },
    });
    expect(row.question.text).toBe('马斯克智商很高，好像包容性差点');
    expect(row.question.segmentId).toBe('q1');
    expect(row.question.label).toBe('网友提问');
    // 提问是上下文，不做命中高亮（金色只标本人的原文里命中的那处）
    expect(row.question.runs.every((r) => !r.highlight)).toBe(true);

    // 上文其实是他自己以前的发言（雪球昵称）→ 不能叫「网友提问」
    const own = toResult({
      passage_id: 'p2',
      doc_id: 'd2',
      segment_id: 's2',
      text: '是的',
      question: { segment_id: 'q2', text: '我理解信仰就是要做对的事情', speaker_person_id: 'duan_yongping' },
    });
    expect(own.question.label).toBe('他此前说过');

    // 取不到就没有这一行，不猜
    expect(toResult({ passage_id: 'p3', doc_id: 'd3', text: 'x' }).question).toBeNull();
    expect(toQuestion({ segment_id: 'q3', text: '   ' })).toBeNull();
    expect(toQuestion(undefined)).toBeNull();
    expect(questionLabel(undefined)).toBe('网友提问');
  });

  test('标题与正文逐字相同时不再重复印一遍（雪球一句话帖占 38%）', () => {
    const same = toResult({
      passage_id: 'p1',
      doc_id: 'd1',
      text: '你说的是大聪明？',
      source: { source_type: 'xueqiu', title: '你说的是大聪明？' },
    });
    expect(same.title).toBe('');
    const diff = toResult({
      passage_id: 'p2',
      doc_id: 'd2',
      text: '小聪明。',
      source: { source_type: 'netease_blog', title: '聪明和智慧的区别' },
    });
    expect(diff.title).toBe('聪明和智慧的区别');
  });

  test('标题就是正文开头时同样不重复印（源头把首句当标题，常被截在半句上）', () => {
    // 实测：搜 6 个关键词的 300 条结果里 60 条是这种形状
    const cut = toResult({
      passage_id: 'p3',
      doc_id: 'd3',
      text: '巴菲特只投资在自己的能力圈范围内。他很不喜欢变化，但他也说过，如果你能看懂这种变化的话。',
      source: { source_type: 'xueqiu', title: '巴菲特只投资在自己的能力圈范围内。他很不喜欢变化，但他也说过，如果你能看懂这种变' },
    });
    expect(cut.title).toBe('');
    const boundary = toResult({
      passage_id: 'p4',
      doc_id: 'd4',
      text: '1：知道自己能力圈有多大，这也是人们能看到很多很“聪明”的人投资表现长期不好的原因。',
      source: { source_type: 'xueqiu', title: '1：知道自己能力圈有多大' },
    });
    expect(boundary.title).toBe('');
    // 真标题（正文里没这句）照常显示
    const real = toResult({
      passage_id: 'p5',
      doc_id: 'd5',
      text: '小聪明是要吃亏的。',
      source: { source_type: 'netease_blog', title: '好汉不吃亏' },
    });
    expect(real.title).toBe('好汉不吃亏');
  });

  test('被本人回复的那条上文：默认「网友提问」，是他自己的话则标「他此前说过」', () => {
    const own = toBlock({
      block_id: 'b1', segment_id: 's1', order: 0, text: '他此前说过的话', storage_scope: 'context',
      speaker: { label: '大道无形我有型' }, is_owner_question: true, question_speaker_person_id: 'duan_yongping',
    });
    expect(own.speakerLabel).toBe('他此前说过');
    expect(own.isQuestion).toBe(true);
    const netizen = toBlock({
      block_id: 'b2', segment_id: 's2', order: 1, text: '网友的话', storage_scope: 'context',
      speaker: { label: '卢玉强' }, is_owner_question: true, question_speaker_person_id: null,
    });
    expect(netizen.speakerLabel).toBe('网友提问');
  });

  test('被本人回复的那条提问只标「网友提问」，不暴露网友名字', () => {
    const q = toBlock({ block_id: 'b1', segment_id: 's1', order: 0, text: '做投资更难了', storage_scope: 'context', speaker: { label: '卢玉强' }, is_owner_question: true });
    expect(q.speakerLabel).toBe('网友提问');
    expect(q.isQuestion).toBe(true);
    const other = toBlock({ block_id: 'b2', segment_id: 's2', order: 1, text: '主持人提问', storage_scope: 'context', speaker: { label: '主持人' } });
    expect(other.speakerLabel).toBe('主持人');
    expect(other.isQuestion).toBe(false);
  });

  test('来源/命中名称可读化', () => {
    expect(sourceName('xueqiu')).toBe('雪球');
    expect(matchName('terms')).toBe('相关');
    expect(matchName('whatever')).toBe('相关');
    expect(timecode(null)).toBe('');
  });

  test('keywordRuns 逐字标高亮，不改动原文一个字', () => {
    const runs = keywordRuns('做对的事情，把事情做对', '做对');
    expect(runs.map((r) => r.text).join('')).toBe('做对的事情，把事情做对');
    expect(runs.filter((r) => r.highlight).map((r) => r.text)).toEqual(['做对', '做对']);
    expect(keywordRuns('没有那个词', '做对')).toEqual([{ text: '没有那个词', highlight: false }]);
    expect(keywordRuns('任意文本', '')).toEqual([{ text: '任意文本', highlight: false }]);
  });

  test('toTopicItem 带专题名时把该词标成高亮，且首尾裁剪后仍对得上', () => {
    const row = toTopicItem(
      {
        order: 0,
        segment_id: 's1',
        doc_id: 'd1',
        text: '\n做对的事情，然后把事情做对。',
        source_tier: 'primary',
        date_label: '2011',
        title: '在浙大给毕业生的讲话',
      },
      '做对',
    );
    expect(row.text).toBe('做对的事情，然后把事情做对。');
    expect(row.runs.map((r) => r.text).join('')).toBe(row.text);
    expect(row.runs.filter((r) => r.highlight)).toHaveLength(2);
  });

  test('toTopicItem 映射专题项：粗体区间、出处、可回原文', () => {
    const row = toTopicItem({
      order: 4,
      doc_id: 'd9',
      segment_id: 's9',
      start_cp: 0,
      end_cp: 10,
      title: '2005-步步高十周年讲话',
      text: '**做对的事情**比把事情做对更重要',
      source_tier: 'primary',
      date_label: '2005-10-01',
    });
    expect(row.docId).toBe('d9');
    expect(row.segmentId).toBe('s9');
    expect(row.sourceLine).toBe('2005-10-01');
    expect(row.tierLabel).toBe('');
    expect(row.runs[0]).toEqual({ text: '做对的事情', bold: true, highlight: false });
    expect(row.runs.map((r) => r.text).join('')).not.toContain('**');
  });
});

describe('展示层首尾裁剪', () => {
  test('trimEdges 去掉开头空行，保留内部换行与空格', () => {
    expect(trimEdges('\n\n本分是 对的事\n改\n\n', undefined).text).toBe('本分是 对的事\n改');
  });

  test('裁剪后 highlight 区间仍然落在正确的字上', () => {
    const text = '\n\n本分是不做不对的事';
    const runs = [
      { text: '\n\n', highlight: false },
      { text: '本分', highlight: true },
      { text: '是不做不对的事', highlight: false },
    ];
    const row = toResult({ passage_id: 'p', doc_id: 'd', text, highlight_runs: runs });
    expect(row.text).toBe('本分是不做不对的事');
    expect(row.runs[0]).toEqual({ text: '本分', bold: false, highlight: true });
  });
});

describe('原文强调标记（**…**）渲染', () => {
  test('成对的 ** 转粗体，标记本身不进正文', () => {
    expect(parseInline('**1.本分是化繁为简**\n下一段')).toEqual([
      { text: '1.本分是化繁为简', bold: true },
      { text: '\n下一段', bold: false },
    ]);
  });

  test('落单的 ** 原样保留，不吞后面的正文', () => {
    expect(parseInline('被行使的机会**增加')).toEqual([{ text: '被行使的机会**增加', bold: false }]);
    expect(parseInline('a**b**c**d')).toEqual([
      { text: 'a', bold: false },
      { text: 'b', bold: true },
      { text: 'c**d', bold: false },
    ]);
  });

  test('没有标记时只有一段原文', () => {
    expect(parseInline('平常心就是平常心')).toEqual([{ text: '平常心就是平常心', bold: false }]);
    expect(parseInline(undefined)).toEqual([{ text: '', bold: false }]);
  });

  test('toRuns 叠加强调与命中高亮，标记本身不出现在正文里', () => {
    const runs = toRuns('**本分**是不对的事', [
      { text: '**本分**', highlight: true },
      { text: '是不对的事', highlight: false },
    ]);
    expect(runs.map((r) => r.text).join('')).toBe('本分是不对的事');
    expect(runs).toEqual([
      { text: '本分', bold: true, highlight: true },
      { text: '是不对的事', bold: false, highlight: false },
    ]);
  });

  test('toResult 的 runs 覆盖全文且保留高亮', () => {
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text: '**本分**是不做不对的事',
      highlight_runs: [
        { text: '**本分**', highlight: true },
        { text: '是不做不对的事', highlight: false },
      ],
    });
    expect(row.runs.map((r) => r.text).join('')).toBe('本分是不做不对的事');
    expect(row.runs[0]).toEqual({ text: '本分', bold: true, highlight: true });
    expect(row.text).toBe('**本分**是不做不对的事');
  });

  test('toBlock 产出 segs 供阅读页内联渲染', () => {
    const block = toBlock({ block_id: 'b', segment_id: 's', text: '前**重点**后', storage_scope: 'corpus' });
    expect(block.segs).toEqual([
      { text: '前', bold: false },
      { text: '重点', bold: true },
      { text: '后', bold: false },
    ]);
  });
});

describe('访谈转录稿按文章排', () => {
  test('只有 transcript（演讲/采访）走一大卡片', () => {
    expect(isArticleDoc({ source_type: 'transcript' })).toBe(true);
  });

  test('博客/雪球/文章仍一段一卡，别把评论区的卡片边界也吃掉', () => {
    expect(isArticleDoc({ source_type: 'netease_blog' })).toBe(false);
    expect(isArticleDoc({ source_type: 'xueqiu' })).toBe(false);
    expect(isArticleDoc({ source_type: 'article' })).toBe(false);
  });

  test('脏输入不炸，一律当非转录稿', () => {
    expect(isArticleDoc(null)).toBe(false);
    expect(isArticleDoc(undefined)).toBe(false);
    expect(isArticleDoc({})).toBe(false);
    expect(isArticleDoc({ source_type: '' })).toBe(false);
  });
});

describe('回到顶部按钮的出现时机', () => {
  test('页顶不出现，滚过约一屏才出现，阈值可覆盖', () => {
    expect(topperVisible(0)).toBe(false);
    expect(topperVisible(TOPPER_SHOW_AT_PX)).toBe(false); // 正好等于阈值仍不出现
    expect(topperVisible(TOPPER_SHOW_AT_PX + 1)).toBe(true);
    expect(topperVisible(1200, 300)).toBe(true);
    expect(topperVisible(200, 300)).toBe(false);
  });

  test('脏输入不炸，且一律当“不显示”', () => {
    expect(topperVisible(undefined)).toBe(false);
    expect(topperVisible(null)).toBe(false);
    expect(topperVisible(NaN)).toBe(false);
    expect(topperVisible('abc')).toBe(false);
    expect(topperVisible('900')).toBe(true); // 字符串数字仍可用
  });
});

describe('日期精度提示只在数据里，不给用户看', () => {
  // 用户 2026-10-03：「日期仅精确到月/年」这种提示不需要显示。语料与接口一字未动，
  // 只在展示层摘掉；其它警告（转录未校对、说话人未识别……）必须原样保留。
  test('认得出「日期仅精确到…」，且只认这一句', () => {
    expect(isDatePrecisionNote('日期仅精确到年')).toBe(true);
    expect(isDatePrecisionNote('日期仅精确到月')).toBe(true);
    expect(isDatePrecisionNote('日期仅精确到日')).toBe(true);
    expect(isDatePrecisionNote('转录未经逐字校对')).toBe(false);
    expect(isDatePrecisionNote('')).toBe(false);
    expect(isDatePrecisionNote(null)).toBe(false);
    expect(isDatePrecisionNote(undefined)).toBe(false);
  });

  test('摘掉它，别的警告一条不丢、顺序不变', () => {
    expect(stripDatePrecisionNotes(['日期仅精确到年', '转录未经逐字校对'])).toEqual(['转录未经逐字校对']);
    expect(stripDatePrecisionNotes(['转录未经逐字校对', '日期仅精确到月'])).toEqual(['转录未经逐字校对']);
    expect(stripDatePrecisionNotes(['日期仅精确到年'])).toEqual([]);
    // 脏输入不炸，一律当空
    expect(stripDatePrecisionNotes(undefined)).toEqual([]);
    expect(stripDatePrecisionNotes(null)).toEqual([]);
    expect(stripDatePrecisionNotes('日期仅精确到年')).toEqual([]);
  });

  test('toResult 的 warnings 里不再出现它', () => {
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text: '原文',
      warnings: ['日期仅精确到年', '转录未经逐字校对'],
    });
    expect(row.warnings).toEqual(['转录未经逐字校对']);
  });

  test('toBlock 的 defects 里不再出现它（页首没提过时也一样）', () => {
    const block0 = { block_id: 'b', segment_id: 's', order: 0, text: 'x', storage_scope: 'corpus', defects: ['日期仅精确到月', '说话人未识别'] };
    expect(toBlock(block0).defects).toEqual(['说话人未识别']);
    expect(toBlock(block0, ['日期仅精确到月']).defects).toEqual(['说话人未识别']);
  });

  test('标题与正文里那句逐字相同时，原文页不再重复印标题（雪球一句话帖）', () => {
    const blocks = [
      { text: '在此，大道说的是投资信仰。', isOwner: false },
      { text: '是的，所谓信仰就是要做对的事情。', isOwner: true },
    ];
    expect(titleRepeatedInBlocks('是的，所谓信仰就是要做对的事情。', blocks)).toBe(true);
    expect(titleRepeatedInBlocks('  是的，所谓信仰就是要做对的事情。 ', blocks)).toBe(true);
    // 标题是正文开头（源头把首句／被截断的首句当标题）：用户 2026-10-11 截图里就是这种，不能再印一遍
    const long = [{ text: '1：知道自己能力圈有多大或者说明白自己能力圈的边界在哪里要远远重要过能力圈有多大，这也是人们能看到很多很“聪明”的人投资表现长期不好的原因。', isOwner: true }];
    expect(titleRepeatedInBlocks('1：知道自己能力圈有多大或者说明白自己能力圈的边界在哪里要远远重要过能力圈有多大', long)).toBe(true);
    const cutMid = [{ text: '巴菲特只投资在自己的能力圈范围内。他很不喜欢变化。', isOwner: true }];
    expect(titleRepeatedInBlocks('巴菲特只投资在自己的能力圈范围内。他很不喜欢变', cutMid)).toBe(true);
    // 真标题、或那句只是别人说的，都要照常显示
    expect(titleRepeatedInBlocks('我在雪球上的发言合集', blocks)).toBe(false);
    expect(titleRepeatedInBlocks('在此，大道说的是投资信仰。', blocks)).toBe(false);
    expect(titleRepeatedInBlocks('', blocks)).toBe(false);
    expect(titleRepeatedInBlocks('是的，所谓信仰就是要做对的事情。', [{ text: '是的，所谓信仰就是要做对的事情。', isOwner: false }])).toBe(false);
  });

  test('整篇每一段都带它时，文档级缺陷是空的（不会在页首冒出来）', () => {
    const toc = [{ defects: ['日期仅精确到年', '转录未经逐字校对'] }, { defects: ['日期仅精确到年', '转录未经逐字校对'] }];
    expect(docLevelDefects(toc)).toEqual(['转录未经逐字校对']);
    expect(docLevelDefects([{ defects: ['日期仅精确到年'] }, { defects: ['日期仅精确到年'] }])).toEqual([]);
  });
});

describe('命中靠后时把命中的上文压成「…」（用户 2026-10-11 报的长卡片）', () => {
  test('命中在片段 80% 处时，前面的正文压到一两行、命中落在开头附近', () => {
    // 用户截图那条的形状：片段 778 字、命中在第 624 字，要往下滚 2.3 屏才看到
    const head = '他讲了很多关于企业经营和投资的事情。';
    const text = head + '乙'.repeat(600) + '陈明永' + '丙'.repeat(100);
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: head + '乙'.repeat(600), highlight: false },
        { text: '陈明永', highlight: true },
        { text: '丙'.repeat(100), highlight: false },
      ],
    });
    expect(row.text.startsWith('…')).toBe(true);
    expect(row.text.length).toBeLessThan(text.length / 2); // 前面的 600 字被压掉
    const firstHit = row.runs.findIndex((r) => r.highlight);
    const before = row.runs.slice(0, firstHit).map((r) => r.text).join('');
    expect(before.slice(1).length).toBeLessThanOrEqual(40); // 命中落在前两行
    expect(before).not.toMatch(/\n/);
    expect(row.runs.filter((r) => r.highlight).map((r) => r.text).join('')).toBe('陈明永');
    expect(row.runs.map((r) => r.text).join('')).toBe(row.text);
  });

  test('一段里命中几次就报几次（用户 2026-10-11 确认的小签）', () => {
    const text = '聪明和智慧不一样。小聪明是要吃亏的，大聪明更要小心。';
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '聪明', highlight: true },
        { text: '和智慧不一样。小', highlight: false },
        { text: '聪明', highlight: true },
        { text: '是要吃亏的，大', highlight: false },
        { text: '聪明', highlight: true },
        { text: '更要小心。', highlight: false },
      ],
    });
    expect(row.hitCount).toBe(3);
    const one = toResult({ passage_id: 'p2', doc_id: 'd2', text: '本分很重要。', highlight_runs: [{ text: '本分', highlight: true }, { text: '很重要。', highlight: false }] });
    expect(one.hitCount).toBe(1);
    expect(toResult({ passage_id: 'p3', doc_id: 'd3', text: '没有高亮' }).hitCount).toBe(0);
  });

  test('命中本来就在开头时，一个字都不动、也不加省略号', () => {
    const text = '陈明永说过，本分很重要。'.repeat(12);
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '陈明永', highlight: true },
        { text: text.slice(3), highlight: false },
      ],
    });
    expect(row.text).toBe(text);
    expect(row.runs[0]).toEqual({ text: '陈明永', bold: false, highlight: true });
  });

  test('接口没给 highlight_runs（定位不到命中）时不动正文，交给 12 行裁切兜底', () => {
    const text = '甲'.repeat(300) + '陈明永';
    const row = toResult({ passage_id: 'p', doc_id: 'd', text });
    expect(row.text).toBe(text);
    expect(row.runs.map((r) => r.text).join('')).toBe(text);
  });

  test('预算位之后有标点时切在它后面，开场是完整的一句', () => {
    // 实测形状：命中前是「…金志江、OPPO创始人陈明永」，不该切成「…始人陈明永」
    const text = '甲'.repeat(100) + '。乙' + '丙'.repeat(20) + '陈明永';
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '甲'.repeat(100) + '。乙' + '丙'.repeat(20), highlight: false },
        { text: '陈明永', highlight: true },
      ],
    });
    expect(row.text).toBe('…乙' + '丙'.repeat(20) + '陈明永');
  });

  test('切点往前找句子边界，不从句子中间切开', () => {
    const text = '甲'.repeat(50) + '。' + '乙'.repeat(30) + '陈明永';
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '甲'.repeat(50) + '。' + '乙'.repeat(30), highlight: false },
        { text: '陈明永', highlight: true },
      ],
    });
    expect(row.text).toBe('…' + '乙'.repeat(30) + '陈明永');
  });

  test('往前找不到句末时用预算位，不会为了凑句子把上文拉长', () => {
    const text = '甲'.repeat(70) + '，' + '乙'.repeat(30) + '陈明永';
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '甲'.repeat(70) + '，' + '乙'.repeat(30), highlight: false },
        { text: '陈明永', highlight: true },
      ],
    });
    expect(row.text).toBe('…' + '乙'.repeat(30) + '陈明永');
  });

  test('切点正好落在标点上时往后让一格，不出现「…，后半句」', () => {
    const text = '甲'.repeat(69) + '，' + '乙'.repeat(29) + '陈明永';
    const row = toResult({
      passage_id: 'p',
      doc_id: 'd',
      text,
      highlight_runs: [
        { text: '甲'.repeat(69) + '，' + '乙'.repeat(29), highlight: false },
        { text: '陈明永', highlight: true },
      ],
    });
    expect(row.text).toBe('…' + '乙'.repeat(29) + '陈明永');
  });
});

describe('源头重复：同一篇发两遍的卡片折掉后面的（用户 2026-10-11）', () => {
  const body = 'OPPO诞生至少经历了5年酝酿期，段说自己很少插手这件事，都是步步高其他同事在运作，但这仍是令他兴奋的话题。段永平将OPPO定位为全球性品牌。';
  const mk = (over) => toResult(Object.assign({
    passage_id: 'p', doc_id: 'd', text: body, match_kind: 'literal',
    speaker: { person_id: 'duan_yongping', label: '段永平' },
    source: { source_type: 'netease_blog', date_label: '2014-04-25', title: '【转载】段永平谈“经营、投资与慈善”（05）' },
    highlight_runs: [{ text: body.slice(0, 8), highlight: true }, { text: body.slice(8), highlight: false }],
  }, over));

  test('同来源 + 标题一致 + 正文几乎一样 → 只留前面那张', () => {
    const a = mk({ passage_id: 'p1', doc_id: 'd1' });
    const b = mk({ passage_id: 'p2', doc_id: 'd2', source: { source_type: 'netease_blog', date_label: '2014-04-25', title: '【转载】段永平谈“经营、投资与慈善”（05）' } });
    const out = collapseDuplicates([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].docId).toBe('d1');
  });

  test('标题装饰不同（引用/【转载】）也算同一篇', () => {
    const a = mk({ doc_id: 'd1', source: { source_type: 'netease_blog', title: '引用 巴菲特给MBA的讲话：佛罗里达大学一次演讲' } });
    const b = mk({ doc_id: 'd2', source: { source_type: 'netease_blog', title: '【转载】巴菲特给MBA的讲话：佛罗里达大学一次演讲' } });
    expect(collapseDuplicates([a, b])).toHaveLength(1);
  });

  test('标题不同、正文一样 → 不折（他在不同帖子里引同一段话是常态）', () => {
    const a = mk({ doc_id: 'd1', source: { source_type: 'netease_blog', title: '企业经营的一点看法' } });
    const b = mk({ doc_id: 'd2', source: { source_type: 'netease_blog', title: '回答网友提问（2019）' } });
    expect(collapseDuplicates([a, b])).toHaveLength(2);
  });

  test('同标题但正文差得多 → 不折；短正文不参与比对', () => {
    const a = mk({ doc_id: 'd1' });
    const b = mk({ doc_id: 'd2', text: 'OPPO诞生至少经历了5年酝酿期，后面的内容完全不一样，讲的是别的事情，价值观和本分。' });
    expect(collapseDuplicates([a, b])).toHaveLength(2);
    const shortA = mk({ passage_id: 'p3', doc_id: 'd3', text: '本分就是不做不对的事。' });
    const shortB = mk({ passage_id: 'p4', doc_id: 'd4', text: '本分就是不做不对的事。' });
    expect(collapseDuplicates([shortA, shortB])).toHaveLength(2);
  });

  test('不同来源（雪球 vs 网易博客）不折', () => {
    const a = mk({ doc_id: 'd1' });
    const b = mk({ doc_id: 'd2', source: { source_type: 'xueqiu', date_label: '2014-04-25', title: '【转载】段永平谈“经营、投资与慈善”（05）' } });
    expect(collapseDuplicates([a, b])).toHaveLength(2);
  });

  test('没有标题（标题与正文开头重复被省掉）不参与折叠，宁可漏也不误合', () => {
    const a = mk({ doc_id: 'd1', source: { source_type: 'xueqiu', title: body.slice(0, 30) } });
    const b = mk({ doc_id: 'd2', source: { source_type: 'xueqiu', title: body.slice(0, 30) } });
    expect(a.title).toBe('');
    expect(collapseDuplicates([a, b])).toHaveLength(2);
  });
});
