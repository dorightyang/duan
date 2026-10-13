/**
 * 把接口返回的结构映射成页面视图模型（纯函数，可 node 单测）。
 * 原则：只做展示映射，不改改写、不概括原文。
 */

/**
 * 把原文里的 `**强调**` 定位成区间。只认成对的 `**`：
 * 落单的 `**`（来源里常见）原样保留，绝不吞掉后面的正文。
 * @param {string} text @returns {{start:number,end:number,bold:boolean}[]}
 */
function inlineSpans(text) {
  const src = String(text == null ? '' : text);
  /** @type {{start:number,end:number,bold:boolean}[]} */
  const out = [];
  let plainStart = 0;
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('**', i)) {
      const close = src.indexOf('**', i + 2);
      if (close > i + 2) {
        if (i > plainStart) out.push({ start: plainStart, end: i, bold: false });
        out.push({ start: i + 2, end: close, bold: true });
        i = close + 2;
        plainStart = i;
        continue;
      }
      i = close === -1 ? src.length : i + 4;
      continue;
    }
    i += 1;
  }
  if (src.length > plainStart) out.push({ start: plainStart, end: src.length, bold: false });
  if (!out.length) out.push({ start: 0, end: src.length, bold: false });
  return out;
}

/**
 * `**强调**` → 可渲染的文本段（原生 <text> 内联，不拼 HTML、不用 rich-text）。
 * @param {string} text @returns {{text:string,bold:boolean}[]}
 */
function parseInline(text) {
  const src = String(text == null ? '' : text);
  return inlineSpans(src).map((s) => ({ text: src.slice(s.start, s.end), bold: s.bold }));
}

/**
 * 把「粗体层」和「命中高亮层」合并成渲染用 runs。
 * @param {string} text
 * @param {{text:string,highlight?:boolean}[]|undefined} highlightRuns
 * @returns {{text:string,bold:boolean,highlight:boolean}[]}
 */
function toRuns(text, highlightRuns) {
  const src = String(text == null ? '' : text);
  const source = Array.isArray(highlightRuns) && highlightRuns.length ? highlightRuns : [{ text: src, highlight: false }];
  /** @type {{start:number,end:number}[]} */
  const spans = [];
  let offset = 0;
  for (const run of source) {
    const t = String(run.text == null ? '' : run.text);
    if (run.highlight && t.length) spans.push({ start: offset, end: offset + t.length });
    offset += t.length;
  }
  /** @type {{text:string,bold:boolean,highlight:boolean}[]} */
  const out = [];
  for (const bold of inlineSpans(src)) {
    const cuts = [bold.start, bold.end];
    for (const h of spans) {
      if (h.start > bold.start && h.start < bold.end) cuts.push(h.start);
      if (h.end > bold.start && h.end < bold.end) cuts.push(h.end);
    }
    cuts.sort((a, b) => a - b);
    for (let k = 0; k < cuts.length - 1; k += 1) {
      const start = cuts[k];
      const end = cuts[k + 1];
      if (end <= start) continue;
      const highlight = spans.some((h) => h.start <= start && end <= h.end);
      const prev = out[out.length - 1];
      if (prev && prev.bold === bold.bold && prev.highlight === highlight) prev.text += src.slice(start, end);
      else out.push({ text: src.slice(start, end), bold: bold.bold, highlight });
    }
  }
  return out.length ? out : [{ text: '', bold: false, highlight: false }];
}

/** @type {Record<string, string>} */
const SOURCE_NAMES = {
  netease_blog: '网易博客',
  xueqiu: '雪球',
  transcript: '演讲/采访',
  article: '文章',
  meta: '其他',
};

// 一手是这个语料的默认状态（本人博客/雪球/演讲采访），默认不必强调；
// 只有二手（记者特稿、第三方整理）才需要标出来。用户 2026-09-29 验收意见。
/** @type {Record<string, string>} */
const TIER_NAMES = { primary: '', secondary: '二手' };

/** @type {Record<string, string>} */
const MATCH_NAMES = {
  literal: '逐字命中',
  normalized_literal: '短语命中',
  terms: '相关',
  semantic: '语义相关',
  context: '上下文',
};

/** @param {string} sourceType */
function sourceName(sourceType) {
  return SOURCE_NAMES[sourceType] || sourceType || '来源未知';
}

/** @param {string} tier */
function tierName(tier) {
  return TIER_NAMES[tier] || '';
}

/** @param {string} kind */
function matchName(kind) {
  return MATCH_NAMES[kind] || '相关';
}

/**
 * 展示层裁掉首尾空白（含开头那个空行）。
 * 只动首尾、不动中间内容，也不改语料与库里的原文——「零生成」不受影响。
 * highlight_runs 按同一窗口一起裁，保证高亮区间仍然对得上。
 * @param {string} text
 * @param {{text:string,highlight?:boolean}[]|undefined} highlightRuns
 */
function trimEdges(text, highlightRuns) {
  const src = String(text == null ? '' : text);
  const lead = (src.match(/^\s*/) || [''])[0].length;
  const trimmed = src.replace(/^\s+/, '').replace(/\s+$/, '');
  if (!Array.isArray(highlightRuns) || !highlightRuns.length) return { text: trimmed, runs: highlightRuns };
  const end = lead + trimmed.length;
  /** @type {{text:string,highlight:boolean}[]} */
  const out = [];
  let offset = 0;
  for (const run of highlightRuns) {
    const t = String(run.text == null ? '' : run.text);
    const start = offset;
    offset += t.length;
    const cutStart = Math.max(start, lead);
    const cutEnd = Math.min(offset, end);
    if (cutEnd > cutStart) out.push({ text: t.slice(cutStart - start, cutEnd - start), highlight: Boolean(run.highlight) });
  }
  return { text: trimmed, runs: out };
}

/**
 * 命中之前最多留多少字的上下文（约一两行）；更早的内容压掉、开头打「…」。
 * 依据：片段硬上限 800 字（kb-qa chunk.py HARD_MAX），一屏只能放 220–270 字，
 * 而命中可以落在片段里的任何位置 —— 用户 2026-10-11 截图：搜「陈明永」，
 * 命中在第 624 字（80% 处），要往下滚 2.3 屏才看到。
 */
const HIT_LEAD_CHARS = 30;

/** 能当切点的标点/换行：切在它后面，读起来就是一句的开头 */
const BREAK_PUNCT = '。！？；：，、\n.!?;:';
/** 切点后面紧跟着的标点一并跳过，避免出现「…，后半句」 */
const SKIP_PUNCT = '，。、；：！？”』）》…·,.;:!?)]}';

/**
 * 命中落在很靠后的位置时，把命中之前的正文压掉、只留一两行上下文，开头用「…」。
 * 命中本来就在开头（绝大多数卡片）时原样返回；接口没给 highlight_runs 时也原样返回
 * （定位不到命中，宁可不压，见 TASK §3.50）。
 * 切点往前找句子边界，找不到就用预算位；切完再跳过开头的标点/空白。
 * @param {string} text
 * @param {{text:string,highlight?:boolean}[]|undefined} runs
 */
function focusOnFirstHit(text, runs) {
  const src = String(text == null ? '' : text);
  if (!Array.isArray(runs) || !runs.length) return { text: src, runs };
  let offset = 0;
  let firstHit = -1;
  for (const run of runs) {
    const t = String(run.text == null ? '' : run.text);
    if (run.highlight && t.length) {
      firstHit = offset;
      break;
    }
    offset += t.length;
  }
  if (firstHit <= HIT_LEAD_CHARS) return { text: src, runs };
  const base = firstHit - HIT_LEAD_CHARS;
  // 先看预算位之后有没有标点：切在它后面，开场就是一句完整的话
  //（实测：这样能把「…始人段永平的注意」变成「…、OPPO创始人陈明永」）
  let at = -1;
  for (let j = base; j < firstHit; j += 1) {
    if (BREAK_PUNCT.indexOf(src[j]) >= 0) {
      at = j + 1;
      break;
    }
  }
  if (at < 0) {
    // 没有标点就往回找 14 个字，找到切在它后面，否则老老实实用预算位
    at = base;
    for (let k = 0; k < 14 && at > 0; k += 1) {
      if (BREAK_PUNCT.indexOf(src[at - 1]) >= 0) break;
      at -= 1;
    }
    if (at <= 0 || at >= firstHit || BREAK_PUNCT.indexOf(src[at - 1]) < 0) at = base;
  }
  while (at < firstHit && SKIP_PUNCT.indexOf(src[at]) >= 0) at += 1;
  at += (src.slice(at).match(/^\s*/) || [''])[0].length;
  if (at <= 0 || at >= firstHit) return { text: src, runs };
  /** @type {{text:string,highlight:boolean}[]} */
  const out = [{ text: '…', highlight: false }];
  let off = 0;
  for (const run of runs) {
    const t = String(run.text == null ? '' : run.text);
    const start = off;
    off += t.length;
    if (off <= at) continue;
    const piece = t.slice(Math.max(0, at - start));
    if (piece) out.push({ text: piece, highlight: Boolean(run.highlight) });
  }
  return { text: '…' + src.slice(at), runs: out };
}

/**
 * 源头把同一篇东西发了两遍（两个 URL、正文基本重合）时，搜索结果里就会出现两张
 * 几乎一样的卡片。用户 2026-10-11：看到一个修一个，零成本先在前端折叠。
 * 折叠规则要求**同一来源 + 标题一致 + 正文片段高度重合**，三条同时成立才并：
 * 只按正文像是不够的——他本人会在不同帖子里引同一段话（复述是常态），
 * 那样两张卡的正文也几乎一样，但出处不同、是两条独立的原文。
 */
const DUP_MIN_CHARS = 60;
const DUP_MIN_DICE = 0.8;
const DUP_SHINGLE = 8;

/**
 * 源头两版的标题常带不同装饰（「引用 」「【转载】」），比对前先剥掉
 * @param {string} title
 */
function normalizeTitle(title) {
  return String(title == null ? '' : title)
    .replace(/[【】\[\]（）()《》<>「」『』"'“”‘’\s]/g, '')
    .replace(/^(引用|转载|转发|分享|摘录|编辑)+/, '');
}

/**
 * 标题一致：完全相同，或一个是另一个的一部分（「00-2005-…」vs「2005-…」）
 * @param {string} a @param {string} b
 */
function sameTitle(a, b) {
  if (!a || !b) return false;
  return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
}

/** @param {string} text @param {number} k @returns {Set<string>} */
function shingles(text, k) {
  const src = String(text == null ? '' : text).replace(/\s+/g, '');
  /** @type {Set<string>} */
  const out = new Set();
  if (src.length < k) {
    if (src) out.add(src);
    return out;
  }
  for (let i = 0; i + k <= src.length; i += 1) out.add(src.slice(i, i + k));
  return out;
}

/**
 * Dice 系数（两段文字的 8 字切片重合度）
 * @param {Set<string>} a @param {Set<string>} b
 */
function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit += 1;
  return (2 * hit) / (a.size + b.size);
}

/**
 * 把「同一篇原文的重复卡片」折掉，保留排在前面的那张。
 * 纯函数、只动展示：不删语料、不改接口，被折掉的那篇仍能各自点进原文。
 * @param {any[]} results
 */
function collapseDuplicates(results) {
  const list = Array.isArray(results) ? results : [];
  /** @type {{row:any,title:string,src:string,sh:Set<string>}[]} */
  const kept = [];
  /** @type {any[]} */
  const out = [];
  for (const row of list) {
    if (!row) continue;
    const title = normalizeTitle(row.title);
    const text = String(row.text == null ? '' : row.text).replace(/\s+/g, '');
    const src = String(row.sourceNameText || '');
    let dup = false;
    if (title.length >= 6 && text.length >= DUP_MIN_CHARS) {
      const sh = shingles(text, DUP_SHINGLE);
      dup = kept.some(
        (k) => k.src === src && sameTitle(k.title, title) && dice(k.sh, sh) >= DUP_MIN_DICE,
      );
    }
    if (dup) continue;
    if (title.length >= 6 && text.length >= DUP_MIN_CHARS) {
      kept.push({ row, title, src, sh: shingles(text, DUP_SHINGLE) });
    }
    out.push(row);
  }
  return out;
}

/**
 * 结果卡片：高亮片段直接用接口给的 highlight_runs 原生文本，不拼 HTML。
 * @param {any} item
 */
function toResult(item) {
  const source = item.source || {};
  const speaker = item.speaker || {};
  const trimmed = trimEdges(item.text, item.highlight_runs);
  const shown = focusOnFirstHit(trimmed.text, trimmed.runs);
  const runs = toRuns(shown.text, shown.runs);
  return {
    id: item.passage_id,
    docId: item.doc_id,
    segmentId: item.segment_id,
    runs,
    // 一段里命中几次：卡片头上一枚小签告诉用户「这一句里还有 N 处」。
    // 用户 2026-10-11 确认要（他自己搜「本分」时一段里最多 21 处命中，一屏只看得到第一处）。
    hitCount: runs.filter((run) => run.highlight).length,
    text: shown.text,
    question: toQuestion(item.question),
    speakerLabel: speaker.label || '未署名',
    sourceLine: [sourceName(source.source_type), source.date_label, tierName(source.source_tier)]
      .filter(Boolean)
      .join(' · '),
    sourceNameText: sourceName(source.source_type),
    dateLabel: source.date_label || '',
    tierLabel: tierName(source.source_tier),
    // 雪球/文章的帖子多数没有标题，源头把**第一句**当标题（有的截到 40 字）：
    // 原标题再排一行，等于把正文开头那句印两遍（用户 2026-10-11 截图，400 条结果里 116 条如此）。
    title: titleRepeatedInText(source.title, shown.text) ? '' : source.title || '',
    matchLabel: matchName(item.match_kind),
    warnings: stripDatePrecisionNotes(item.warnings),
    isContinuation: Boolean(item.is_continuation),
  };
}

/** 本人 person_id。库里的引用链段一律不带 person_id，所以后端按署名现算后回传。 */
const OWNER_PERSON_ID = 'duan_yongping';

/**
 * 被回复的那条「上文」是谁说的。
 * 他自己的话（雪球昵称等别名，后端已归一成 person_id）标「他此前说过」，
 * 其余一律「网友提问」。实测库里约 5.7% 的上文其实是他自己以前的发言，
 * 一律叫「网友提问」就是造假。
 * @param {string|null|undefined} personId
 */
function questionLabel(personId) {
  return personId === OWNER_PERSON_ID ? '他此前说过' : '网友提问';
}

/**
 * 搜索结果卡上的「上文」：他这条回答是针对什么说的。
 * 取不到就返回 null —— 宁缺勿错，界面不猜。
 * @param {any} q
 */
function toQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  const shown = trimEdges(q.text, undefined).text;
  if (!shown) return null;
  return {
    segmentId: q.segment_id || '',
    text: shown,
    runs: toRuns(shown, undefined),
    label: questionLabel(q.speaker_person_id),
  };
}

/**
 * 「日期仅精确到年/月」这类**日期精度提示**。
 * 后端把每条记录的 date_precision 如实带到 warnings/defects 里（实测语料里 88 条"仅精确到年"、
 * 3 条"仅精确到月"），但用户 2026-10-03 明确说：不需要专门提醒这个 —— 日期照常显示，
 * 只是别再挂一句"仅精确到年"。纯展示层过滤，语料与接口一字未动。
 */
const DATE_PRECISION_NOTE = /^日期仅精确到/;

/** @param {any} text @returns {boolean} */
function isDatePrecisionNote(text) {
  return DATE_PRECISION_NOTE.test(String(text == null ? '' : text));
}

/**
 * 把日期精度提示从一串提示里摘掉（其余原样保留，顺序不变）。
 * @param {any[]|undefined} list
 * @returns {string[]}
 */
function stripDatePrecisionNotes(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((x) => !isDatePrecisionNote(x));
}

/**
 * 文档级缺陷：该文档**每一段**都带的那几条（例：转录未经逐字校对）。
 * 这种话属于「整篇的状态」，阅读页提示一次就够；跟着每张卡片重复是噪音。
 * 纯展示层判断，语料与接口一字未动。
 * @param {{defects?: string[]}[]|undefined} toc
 * @returns {string[]}
 */
function docLevelDefects(toc) {
  if (!Array.isArray(toc) || !toc.length) return [];
  /** @type {Set<string>} */
  let common = new Set((toc[0] && toc[0].defects) || []);
  for (const seg of toc.slice(1)) {
    const here = new Set((seg && seg.defects) || []);
    common = new Set([...common].filter((d) => here.has(d)));
    if (!common.size) break;
  }
  return stripDatePrecisionNotes([...common]);
}

/**
 * @param {any} block
 * @param {string[]} [docDefects] 已在文档页顶部提示过的缺陷，卡片上不再重复
 */
function toBlock(block, docDefects) {
  const skip = new Set(Array.isArray(docDefects) ? docDefects : []);
  const speaker = block.speaker || {};
  const shown = trimEdges(block.text, undefined);
  // 被本人回复的那条提问：只标「网友提问」，不暴露网友名字（用户 2026-09-29 验收意见）。
  const isQuestion = Boolean(block.is_owner_question);
  return {
    id: block.block_id,
    segmentId: block.segment_id,
    order: block.order,
    text: shown.text,
    segs: parseInline(shown.text),
    // 提问块默认标「网友提问」（不暴露网友名字）；这条上文其实是他自己以前的发言时，
    // 必须改成「他此前说过」——库里这类段是他的雪球昵称，person_id 由后端现算。
    speakerLabel: isQuestion
      ? questionLabel(block.question_speaker_person_id)
      : speaker.name || speaker.label || '',
    isOwner: block.storage_scope === 'corpus',
    isContext: block.storage_scope === 'context',
    isQuestion,
    timecodeMs: block.timecode_ms,
    timeLabel: timecode(block.timecode_ms),
    effectiveDate: block.effective_date || '',
    badges: block.badges || [],
    defects: stripDatePrecisionNotes((block.defects || []).filter((/** @type {string} */ d) => !skip.has(d))),
  };
}

/**
 * 把某个词在原文里的每次出现标成「命中」——用于专题页高亮专题名（如「做对」）。
 * 只做逐字匹配，不做同义/模糊扩展；纯展示层，语料与库里的原文一字不动。
 * @param {string} text @param {string} keyword
 * @returns {{text:string,highlight:boolean}[]}
 */
function keywordRuns(text, keyword) {
  const src = String(text == null ? '' : text);
  const kw = String(keyword == null ? '' : keyword).trim();
  if (!kw) return [{ text: src, highlight: false }];
  /** @type {{text:string,highlight:boolean}[]} */
  const out = [];
  let pos = 0;
  while (pos < src.length) {
    const idx = src.indexOf(kw, pos);
    if (idx < 0) {
      out.push({ text: src.slice(pos), highlight: false });
      break;
    }
    if (idx > pos) out.push({ text: src.slice(pos, idx), highlight: false });
    out.push({ text: src.slice(idx, idx + kw.length), highlight: true });
    pos = idx + kw.length;
  }
  return out.length ? out : [{ text: src, highlight: false }];
}

/**
 * 专题原文项 → 结果卡片视图模型（与搜索结果同一套出处组件）。
 * 专题项没有 speaker 字段（都出自本人），标签只用「二手 + 日期」（一手不标）。
 * @param {any} item @param {string} [keyword] 需要高亮的词（专题名）
 */
function toTopicItem(item, keyword) {
  const raw = String(item.text == null ? '' : item.text);
  const shown = trimEdges(raw, keyword ? keywordRuns(raw, keyword) : undefined);
  return {
    id: `${item.order}-${item.segment_id}`,
    order: item.order,
    docId: item.doc_id,
    segmentId: item.segment_id,
    runs: toRuns(shown.text, shown.runs),
    text: shown.text,
    title: item.title || '',
    tierLabel: tierName(item.source_tier),
    dateLabel: item.date_label || '',
    sourceLine: [tierName(item.source_tier), item.date_label].filter(Boolean).join(' · '),
  };
}

/**
 * 标题是不是已经在正文里出现过了。
 *
 * 源头多数帖子没有标题，适配器就把**第一句**当标题（有的截到 40 字、截在半句上），
 * 于是同一句话在页面上连着出现两遍（用户 2026-10-11 截图：出处卡的标题 + 正文第一行）。
 * 实测语料 12413 篇：7557 篇逐字相同、4192 篇是前缀（其中 3333 篇标题被截在半句上）；
 * 搜索结果卡 300 条里 116 条如此。规则：逐字相同、或标题就是正文开头，都算重复，不再印。
 * @param {string|undefined|null} title @param {string|undefined|null} text
 */
function titleRepeatedInText(title, text) {
  const t = String(title == null ? '' : title).trim();
  const x = String(text == null ? '' : text).trim();
  if (!t || !x) return false;
  // 逐字相同是一种；「标题就是正文开头」是另一种 —— 源头把首句当标题时就是这个形状
  // （实测语料 12413 篇里 7557 篇逐字相同、4192 篇是前缀，其中 3333 篇的标题还被截在半句上）。
  return x === t || x.startsWith(t);
}

/**
 * 顶部「出处卡」的标题是否已经在正文里出现过（出现过就不印，避免同一句话连着两遍）。
 * 只看**本人**说的段：标题在别人的段里出现是正常的，那句本来就该留着。
 * @param {string} title @param {{text?:string,isOwner?:boolean}[]} [blocks]
 */
function titleRepeatedInBlocks(title, blocks) {
  return (blocks || []).some((b) => b && b.isOwner && titleRepeatedInText(title, b.text));
}

/** @param {number|null|undefined} ms */
function timecode(ms) {
  if (ms === null || ms === undefined) return '';
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * 访谈/演讲转录稿（一场对话几百个来回）按「一篇文章」排：
 * 整篇套一张卡、段与段之间只留小间距、说话人写在段首——
 * 一段一卡会把版面碎成几百张小卡片，信息密度低、一屏放不下几句话。
 * 只有 transcript（演讲/采访）走这条；博客/雪球/文章仍一段一卡。
 * 纯展示层判断，语料与接口一字未动。用户 2026-10-02 验收意见。
 * @param {any} doc
 * @returns {boolean}
 */
function isArticleDoc(doc) {
  return Boolean(doc) && doc.source_type === 'transcript';
}

/**
 * 「回到顶部」按钮的出现阈值（px，约一屏）。滚过一屏才出现，避免干扰短页面。
 * 用户 2026-10-02 反馈：结果太多时一直往上滑很久，想要一个一键回顶。
 */
const TOPPER_SHOW_AT_PX = 600;

/**
 * 是否该显示「回到顶部」。纯函数，可 node 单测。
 * @param {number} scrollTopPx 当前 page 滚动距离（px，onPageScroll 给的就是 px）
 * @param {number} [threshold]
 * @returns {boolean}
 */
function topperVisible(scrollTopPx, threshold) {
  const limit = threshold === undefined ? TOPPER_SHOW_AT_PX : Number(threshold);
  const top = Number(scrollTopPx);
  if (!Number.isFinite(top) || !Number.isFinite(limit)) return false;
  return top > limit;
}

module.exports = {
  toResult,
  collapseDuplicates,
  focusOnFirstHit,
  toBlock,
  toQuestion,
  questionLabel,
  docLevelDefects,
  titleRepeatedInBlocks,
  toTopicItem,
  toRuns,
  parseInline,
  trimEdges,
  keywordRuns,
  isDatePrecisionNote,
  stripDatePrecisionNotes,
  sourceName,
  tierName,
  matchName,
  timecode,
  isArticleDoc,
  topperVisible,
  TOPPER_SHOW_AT_PX,
};
