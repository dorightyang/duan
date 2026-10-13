const { toResult } = require('../../utils/view');
const { dayKey, heroCopyText, heroIndexForDay } = require('../../utils/quote');
const HERO_QUOTES = require('../../data/hero-quotes');

// 首页那句的**唯一供给**：一份逐条核过的小清单（来历见 data/hero-quotes.js 头注释）。
// 这里只把快照映射成视图模型 —— 不再进首页就预取一串检索结果，也不再现场筛候选。
// 为什么不再用检索结果：命中的主体是雪球回帖里的应答句，离开原问题就不成立（2026-10-06，见 TASK §3.40）。
const HERO_ROWS = HERO_QUOTES.map(toResult);

// 切换是瞬时的，加一个短锁把连点当成「一次点击」——避免手抖跳过几条。
const CHANGE_LOCK_MS = 250;

/**
 * 每个页面实例的「换一句」状态。放 WeakMap 而不是 `this` 上：这里存的是清单下标，
 * 没必要每帧同步到视图层；WeakMap 只留在逻辑层，页面销毁时自动回收。
 * @typedef {{current:number, queue:number[], lockUntil:number}} ChangeState
 * @type {WeakMap<any, ChangeState>}
 */
const changeStates = new WeakMap();

/** @param {any} page @returns {ChangeState} */
function changeStateOf(page) {
  let state = changeStates.get(page);
  if (!state) {
    state = { current: 0, queue: [], lockUntil: 0 };
    changeStates.set(page, state);
  }
  return state;
}

Page({
  data: {
    /** @type {any} */
    quote: null,
    quoteSourceTop: '',
    quoteSourceBottom: '',
    quoteError: '',
    /** 「换一句」入口是否出现：清单 ≥ 2 条才出现，本轮发完就收起 */
    showChange: false,
  },

  onLoad() {
    const index = heroIndexForDay(HERO_ROWS.length, dayKey());
    if (index < 0) {
      this.setData({ quoteError: '暂时没有取到原文' });
      return;
    }
    const state = changeStateOf(this);
    state.current = index;
    state.queue = this.rotationFrom(index);
    this.showQuote(HERO_ROWS[index]);
    this.setData({ showChange: state.queue.length > 0 });
  },

  /**
   * 本轮顺序：从今天这条之后，按**清单固定顺序**往下走（本次访问内不重复）。
   * 不洗牌：清单本身是逐条核过的，随机只会让一般的那几条和好的一起曝光，没有收益。
   * @param {number} start @returns {number[]}
   */
  rotationFrom(start) {
    const n = HERO_ROWS.length;
    /** @type {number[]} */
    const order = [];
    for (let k = 1; k < n; k += 1) order.push((start + k) % n);
    return order;
  },

  /**
   * 换掉正文、出处、原文页入口 —— 三者必须一起更新，不能新正文点进去打开旧原文。
   * @param {any} row
   */
  showQuote(row) {
    // 出处分两行：说话人·来源 / 日期（一手不标，二手才标）。不再重复原文，也不展示与正文相同的标题。
    this.setData({
      quote: row,
      quoteSourceTop: [row.speakerLabel, row.sourceNameText].filter(Boolean).join(' · '),
      quoteSourceBottom: [row.dateLabel, row.tierLabel].filter(Boolean).join(' · '),
    });
  },

  /**
   * 「换一句」：换成本轮顺序里的下一条。零请求（全部来自核过的小清单），所以没有加载态；
   * 用一个短锁忽略连点。清单里就这几条 —— **发完就收起入口**，不循环、不补池、不再看一轮。
   */
  onTapChangeQuote() {
    if (!this.data.showChange || !this.data.quote) return;
    const state = changeStateOf(this);
    if (!state.queue.length) {
      this.setData({ showChange: false });
      return;
    }
    const now = Date.now();
    if (now < state.lockUntil) return;
    state.lockUntil = now + CHANGE_LOCK_MS;
    const next = state.queue.shift();
    if (next === undefined) {
      this.setData({ showChange: false });
      return;
    }
    state.current = next;
    this.showQuote(HERO_ROWS[state.current]);
    if (!state.queue.length) this.setData({ showChange: false });
  },

  onTapQuote() {
    if (!this.data.quote) return;
    wx.navigateTo({
      url: `/pages/reader/reader?docId=${this.data.quote.docId}&segmentId=${encodeURIComponent(this.data.quote.segmentId || '')}`,
    });
  },

  /**
   * 长按整块原文 → 复制「原文 + 空两行 + —— 年.月 署名  《出处》」，并提示「已复制」。
   * 短按仍是进原文页：微信规则里「绑定并触发了 longpress 之后，这一次不再触发 tap」，
   * 所以两个手势不会互相打架（e2e `ui.index.longpress_copy` 会在真机运行时里验这一点）。
   */
  onLongPressQuote() {
    const text = heroCopyText(this.data.quote);
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' }),
    });
  },

  onTapSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onShareAppMessage() {
    return { title: '段言 · 做对的事情，把事情做对', path: '/pages/index/index' };
  },
});
