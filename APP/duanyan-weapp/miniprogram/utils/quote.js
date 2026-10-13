/**
 * 首页那条原文的取值规则：日期键 → 从**核过的小清单**（`data/hero-quotes.js`）里确定性地取一条。
 *
 * 曾经的离线语录检索（search / highlight / matches / nextIndex…）以及它依赖的
 * `data/quotes.js`（68KB、人工整理的未核验语录）已退役：
 * 段言现在是「零生成 + 每条可回原文」，唯一数据源是后端语料库，包里也不放第二份原文。
 *
 * 2026-10-06 再收紧一层：首页那句**不再直接取关键词检索结果**。实测检索命中的主体是雪球回帖的
 * 应答句（离开原问题就不成立），机械规则筛不掉（见 `data/hero-quotes.js` 头注释与 DEV.md）。
 * 供给改成一份逐条核过的小清单，这里只负责「今天取哪条」。
 */

/**
 * 首页海报的长度窗口（单位：字）。
 *
 * 上限 180 是量出来的：正文 32rpx/1.80、页高 753px 时，204 字实测文字块上沿 207px，
 * 距 27% 收敛线（203px）只剩 4px——再长背景就被"压"回文字里（e2e `ui.index.hero_long`
 * 量的就是这条）。
 * 下限 24 是为了避开搜索结果里的残句（实测有 `做对的事情！`(6)、`19， 要理性，要做对的事情。`(15)）。
 *
 * 这两个常数现在**只服务于离线选材**（`tools/build-hero-list.mjs` 筛候选，再由人工逐条核对），
 * 不再参与线上取值 —— 线上那句直接来自 `data/hero-quotes.js`，那里每一条都在窗口内。
 */
const HERO_MIN_CHARS = 24;
const HERO_MAX_CHARS = 180;

/** 截断优先收在这些标点之后，不要切在句子中间。 */
const CUT_AFTER = /[。！？!?；;…\n]/;
/** 截断点至少要吃掉预算的这么多，否则宁可硬切——避免只截出小半句。 */
const MIN_CUT_RATIO = 0.6;

/** @param {string} text @returns {number} */
function hash(text) {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + (ch.codePointAt(0) || 0)) % 2147483647;
  return h;
}

/** 截断可能把 `**`（加粗）切成落单的一个——那会原样显示成两个星号，丢掉它。
 * @param {string} text @returns {string} */
function dropDanglingBold(text) {
  /** @type {string} */
  const src = String(text);
  if (src.split('**').length % 2) return src;
  const last = src.lastIndexOf('**');
  return last < 0 ? src : src.slice(0, last);
}

/**
 * 截断成摘要：优先在句读处收尾，末尾补 `…` 表示"后面还有"。
 * 纯展示层，只截不改写——语料里那条原文一字未动，点进去仍是完整那条。
 * @param {string} text @param {number} [maxChars]
 * @returns {{text:string, truncated:boolean}}
 */
function excerpt(text, maxChars) {
  /** @type {string} */
  const src = String(text == null ? '' : text);
  const max = maxChars === undefined ? HERO_MAX_CHARS : Number(maxChars);
  if (!Number.isFinite(max) || max <= 0 || src.length <= max) return { text: src, truncated: false };
  const window = src.slice(0, max + 1);
  let cut = 0;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    if (CUT_AFTER.test(window[i])) {
      cut = i + 1;
      break;
    }
  }
  if (cut < max * MIN_CUT_RATIO) cut = max;
  const body = dropDanglingBold(src.slice(0, cut)).replace(/[\s\u3000]+$/, '');
  return { text: `${body}…`, truncated: true };
}

/**
 * 挑出今天展示的那条：优先长度合适的，都不合适就退让，最后才截断。
 * 只做挑选与截断，不改写原文。
 * @param {{text:string}[]} items 已映射成视图模型的候选
 * @param {string} seedKey 同一天同一批候选 → 同一条
 * @param {{min?:number,max?:number}} [opts]
 * @returns {{row:any,text:string,truncated:boolean}|null}
 */
/**
 * 今天展示清单里的第几条：只做确定性哈希，不引入随机数（同一天同一清单 → 同一条）。
 * 清单本身已经逐条核过，所以这里不再挑长度、不再兜底退让、不改写原文。
 * @param {number} size 清单长度
 * @param {string} seedKey 日期键
 * @returns {number} 下标；清单为空时返回 -1
 */
function heroIndexForDay(size, seedKey) {
  const n = Math.floor(Number(size) || 0);
  if (n <= 0) return -1;
  return hash(String(seedKey)) % n;
}

/**
 * 去重用的正文指纹：只留中英文与数字，丢掉标点、空白、表情等一切装饰。
 * 纯函数，可 node 单测。（用白名单而不是 `\p{L}` 属性转义，避免依赖运行时的正则特性。）
 * 现在的用途只有一个：`tools/build-hero-list.mjs` 在**离线选材**时挡掉「同一句话换个标点的两次收录」。
 * 线上不再有它 —— 清单是人工核过的，重复在核对那一步就该被挡掉。
 * @param {string|null|undefined} text @returns {string}
 */
function textFingerprint(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[^0-9a-z\u3400-\u4dbf\u4e00-\u9fff]+/g, '');
}

/**
 * **离线选材**用的下限：短于 `HERO_MIN_CHARS` 的是搜索命中残句，不当候选。
 * 10-04 定这个下限就是为了挡掉「做对的事情！」这类残句；早期「换一句」的池子漏了这一步，
 * 实测「企业文化」这一池 50 条里有 22 条不足 24 字（最短 9 字），换出来全是没头没尾的半句。
 * 现在只有 `tools/build-hero-list.mjs` 用它 —— 线上供给是人工核过的清单，不再现场筛。
 * 注意：过了下限**不等于**有资格上首页（长度只挡残句，不保证能独立成立）。
 * @param {any} row @returns {boolean}
 */
function isHeroCandidate(row) {
  const text = String((row && row.text) == null ? '' : row.text);
  return text.length >= HERO_MIN_CHARS;
}

/**
 * @param {Date} [date]
 * @returns {string} 形如 2026-09-26
 */
function dayKey(date) {
  const value = date ?? new Date();
  /** @param {number} n */
  const pad = (n) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/**
 * 出处日期 → `1999.08` 这种「年.月」。
 * 语料里既有 `2017-05-10` 也有只精确到年的 `2025`，都如实给到"有的精度"，不补零到假的精度。
 * @param {string|null|undefined} label @returns {string}
 */
function yearMonth(label) {
  const m = String(label == null ? '' : label).match(/^(\d{4})(?:[-./年](\d{1,2}))?/);
  if (!m) return '';
  return m[2] ? `${m[1]}.${String(m[2]).padStart(2, '0')}` : m[1];
}

/**
 * 长按复制用的文本（用户 2026-10-06 给的版式）：
 *
 *     原文
 *
 *     （空两行）
 *     —— 1999.08 段永平  《出处》
 *
 * 只用页面已有的字段拼装，不改写原文、不额外请求：
 * - 复制的就是屏幕上那段——若是超长被 excerpt 截过（末尾 `…`），复制的也带省略号，所见即所得；
 * - 日期缺失 / 署名缺失 / 出处标题与正文相同（首页展示本来也不重复标题）时，对应片段整段省略；
 * - 什么出处都没有时只复制原文，不硬凑一行破折号。
 * @param {{text?:string,dateLabel?:string,speakerLabel?:string,title?:string}|null} row
 * @returns {string}
 */
function heroCopyText(row) {
  const r = row || {};
  const text = String(r.text == null ? '' : r.text).trim();
  if (!text) return '';
  const byline = [yearMonth(r.dateLabel), String(r.speakerLabel == null ? '' : r.speakerLabel).trim()]
    .filter(Boolean)
    .join(' ');
  const title = String(r.title == null ? '' : r.title).trim();
  const showTitle = Boolean(title) && title !== text;
  let attribution = '';
  if (byline) attribution = `—— ${byline}${showTitle ? `  《${title}》` : ''}`;
  else if (showTitle) attribution = `—— 《${title}》`;
  return attribution ? `${text}\n\n\n${attribution}` : text;
}

module.exports = {
  dayKey,
  yearMonth,
  heroCopyText,
  hash,
  excerpt,
  heroIndexForDay,
  isHeroCandidate,
  textFingerprint,
  HERO_MIN_CHARS,
  HERO_MAX_CHARS,
};
