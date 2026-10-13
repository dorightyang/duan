/**
 * 首页供给（`data/hero-quotes.js`）的底线检查。
 *
 * 这份清单是**人工逐条核过**的（怎么核的见文件头注释），所以测试不假装能自动判断「有没有价值」；
 * 它只守住那些一旦破了就是硬伤、而且机器能验的底线：
 * 字段够 `toResult` 用、长度在海报窗口内、原文非空、没有近似重复、passage_id 不重复。
 * 取值逻辑（今天取第几条、换个顺序）在 `tests/quote.test.js` 与 e2e 里验。
 */
const HERO_QUOTES = require('../miniprogram/data/hero-quotes');
const { toResult } = require('../miniprogram/utils/view');
const { textFingerprint, HERO_MIN_CHARS, HERO_MAX_CHARS } = require('../miniprogram/utils/quote');

describe('首页供给清单（data/hero-quotes.js）', () => {
  test('不是空清单，而且条数够「换一句」走几轮', () => {
    expect(Array.isArray(HERO_QUOTES)).toBe(true);
    expect(HERO_QUOTES.length).toBeGreaterThanOrEqual(7);
  });

  test('每条都能被 toResult 映射成首页要用的视图模型', () => {
    for (const [i, item] of HERO_QUOTES.entries()) {
      const row = toResult(item);
      expect(row.text.trim().length).toBeGreaterThan(0);
      expect(row.docId).toBeTruthy();
      expect(row.segmentId).toBeTruthy();
      expect(row.speakerLabel).toBeTruthy();
      expect(row.dateLabel).toBeTruthy();
      // 首页海报只渲染 text/bold，runs 必须拼回原文
      expect(row.runs.map((r) => r.text).join('')).toBe(row.text);
      expect(row.runs.some((r) => r.text.length)).toBe(true);
      expect(Array.isArray(row.warnings)).toBe(true);
      expect(typeof i).toBe('number');
    }
  });

  test('每条原文都在海报长度窗口内（不靠截断把超长内容塞进首页）', () => {
    for (const item of HERO_QUOTES) {
      const len = item.text.trim().length;
      expect(len).toBeGreaterThanOrEqual(HERO_MIN_CHARS);
      expect(len).toBeLessThanOrEqual(HERO_MAX_CHARS);
    }
  });

  test('passage_id 不重复，正文也没有「换个标点算两条」的近似重复', () => {
    const ids = new Set();
    const prints = new Set();
    for (const item of HERO_QUOTES) {
      expect(ids.has(item.passage_id)).toBe(false);
      ids.add(item.passage_id);
      const print = textFingerprint(item.text);
      expect(print.length).toBeGreaterThan(0);
      expect(prints.has(print)).toBe(false);
      prints.add(print);
    }
  });

  test('原文不带首尾空白（快照落盘时不该被顺手 trim 掉或补上东西）', () => {
    for (const item of HERO_QUOTES) {
      expect(item.text).toBe(item.text.trim());
    }
  });
});
