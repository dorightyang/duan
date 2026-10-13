const api = require('../../utils/api');
const { toResult, collapseDuplicates, topperVisible } = require('../../utils/view');
const { toTop } = require('../../utils/scroll');

const HOT_WORDS = ['本分', '平常心', '做对的事情', '信任', '不为清单', '企业文化', '长期主义', '诚信'];
/** 「发言人」筛选的展示顺序（用户 2026-10-07 指定）；名单外的（以后新增的人）按接口顺序排在后面。 */
const PERSON_ORDER = ['段永平', '陈明永', '沈炜', '金志江', '黄峥', '李杰'];

const DEBOUNCE_MS = 350;
const PAGE = 20;
/** 一次会话最多往列表里堆这么多条：再多就该让用户加词收窄，而不是把整个列表拖死。 */
const MAX_LOADED = 300;

/**
 * 按 PERSON_ORDER 重排发言人；不在名单里的排在后面，且彼此保持接口给的相对顺序。
 * 入参来自 `coverage()`（未类型化），所以这里按 any 处理，只做顺序、不改字段。
 * @param {any[]} list
 * @returns {any[]}
 */
function orderPeople(list) {
  const rank = (/** @type {any} */ p) => {
    const i = PERSON_ORDER.indexOf(String((p && p.name) || ''));
    return i < 0 ? PERSON_ORDER.length : i;
  };
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map((x) => x.p);
}

/** @type {ReturnType<typeof setTimeout>|null} */
let timer = null;
let seq = 0;

/**
 * 本次结果实际用的检索口径：翻页要沿用，否则第一页和第二页不是同一批东西。
 * @type {'phrase'|'keywords'}
 */
let servedMode = 'phrase';

Page({
  data: {
    keyword: '',
    /** @type {'relevance'|'time_desc'|'time_asc'} */
    sort: 'relevance',
    sortOptions: [
      { key: 'relevance', label: '相关度' },
      { key: 'time_desc', label: '最新在前' },
      { key: 'time_asc', label: '最早在前' },
    ],
    /** @type {string} */
    personId: '',
    /** @type {{person_id:string,name:string,segments:number}[]} */
    people: [],
    hotWords: HOT_WORDS,
    /** @type {any[]} */
    topics: [],
    /** @type {any[]} */
    results: [],
    resultCount: 0,
    summary: '',
    /** @type {number|null} */
    total: null,
    hasMore: false,
    capped: false,
    searched: false,
    loading: false,
    loadingMore: false,
    error: '',
    expandedQueries: [],
    releaseId: '',
    /** 滚过一屏后右下角出现「回到顶部」 */
    showToTop: false,
  },

  onUnload() {
    if (timer) clearTimeout(timer);
  },

  /** 模板里的「回到顶部」绑到这里 */
  toTop,

  /** @param {{ scrollTop: number }} e */
  onPageScroll(e) {
    const show = topperVisible(e.scrollTop);
    if (show !== this.data.showToTop) this.setData({ showToTop: show });
  },

  onLoad() {
    api
      .topics()
      /** @param {any} res */
      .then((res) => {
        const list = ((res && res.topics) || [])
          .filter((/** @type {any} */ t) => t.publication_state === 'published' && t.item_count > 0)
          .slice(0, 3);
        this.setData({ topics: list });
      })
      .catch(() => {});
    api
      .coverage()
      /** @param {any} cov */
      .then((cov) => {
        const people = orderPeople(
          ((cov && cov.people) || []).filter((/** @type {any} */ p) => p.segments > 0),
        );
        this.setData({ people });
      })
      .catch(() => {});
  },

  /** @param {{ currentTarget: { dataset: { topic: string } } }} event */
  onTapTopic(event) {
    const topicId = event.currentTarget.dataset.topic;
    if (!topicId) return;
    wx.navigateTo({ url: `/pages/topic/topic?topicId=${encodeURIComponent(topicId)}` });
  },

  onTapAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  /** @param {{ detail: { value: string } }} event */
  onInput(event) {
    const value = event.detail.value;
    this.setData({ keyword: value });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => this.run(value), DEBOUNCE_MS);
  },

  onConfirm() {
    if (timer) clearTimeout(timer);
    this.run(this.data.keyword);
  },

  onTapClear() {
    if (timer) clearTimeout(timer);
    this.run('');
  },

  /** @param {{ currentTarget: { dataset: { word: string } } }} event */
  onTapHot(event) {
    if (timer) clearTimeout(timer);
    this.run(event.currentTarget.dataset.word);
  },

  /** @param {{ currentTarget: { dataset: { key: 'relevance'|'time_desc'|'time_asc' } } }} event */
  onTapSort(event) {
    const sort = event.currentTarget.dataset.key;
    if (!sort || sort === this.data.sort) return;
    this.setData({ sort });
    if (this.data.searched && this.data.keyword.trim()) this.run(this.data.keyword);
  },

  /** @param {{ currentTarget: { dataset: { id: string } } }} event */
  onTapPerson(event) {
    const personId = event.currentTarget.dataset.id || '';
    if (personId === this.data.personId) return;
    this.setData({ personId });
    if (this.data.searched && this.data.keyword.trim()) this.run(this.data.keyword);
  },

  onTapMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    if (this.data.results.length >= MAX_LOADED) {
      this.setData({ capped: true });
      return;
    }
    this.setData({ loadingMore: true });
    this.fetch(seq, this.data.results.length, true);
  },

  /** @param {{ currentTarget: { dataset: { index: string } } }} event */
  onTapResult(event) {
    const row = this.data.results[Number(event.currentTarget.dataset.index)];
    if (!row || !row.docId) return;
    wx.navigateTo({
      url: `/pages/reader/reader?docId=${row.docId}&segmentId=${encodeURIComponent(row.segmentId || '')}`,
    });
  },

  /** @param {string} keyword */
  run(keyword) {
    const text = String(keyword || '');
    if (!text.trim()) {
      this.setData({ keyword: text, results: [], resultCount: 0, total: null, hasMore: false, capped: false, summary: '', searched: false, error: '' });
      return;
    }
    this.setData({ keyword: text, searched: true, loading: true, error: '', capped: false });
    this.fetch((seq += 1), 0, false);
  },

  /**
   * @param {number} mySeq
   * @param {number} offset
   * @param {boolean} append
   * @param {'phrase'|'keywords'} [mode] 省略时：首查走精确，翻页沿用上一次实际生效的口径
   */
  fetch(mySeq, offset, append, mode) {
    const useMode = mode || (append ? servedMode : 'phrase');
    const opts = {
      query: this.data.keyword.trim(),
      mode: useMode,
      pageSize: PAGE,
      offset,
      sort: this.data.sort,
      personIds: this.data.personId ? [this.data.personId] : [],
    };
    api
      .search(opts)
      .then((res) => {
        if (mySeq !== seq) return;
        const raw = (res && res.items) || [];
        // 精确（整串相邻）一条都没有时，自动放宽成「词命中」再查一次。
        // 这是默认行为的一部分，不给用户开关——他没法判断该用哪个口径。
        if (!append && useMode === 'phrase' && raw.length === 0) {
          this.fetch(mySeq, offset, false, 'keywords');
          return;
        }
        servedMode = useMode;
        const incoming = raw.map(toResult);
        // 源头把同一篇发了两遍时，两张卡几乎一样（用户 2026-10-11）→ 折掉后面那张
        const results = collapseDuplicates(append ? this.data.results.concat(incoming) : incoming);
        const count = (res && res.count) || {};
        const total = typeof count.total === 'number' ? count.total : null;
        const capped = results.length >= MAX_LOADED && Boolean(count.has_more);
        this.setData({
          results,
          resultCount: results.length,
          total,
          hasMore: Boolean(count.has_more) && !capped,
          capped,
          summary: total === null ? `返回 ${results.length} 条原文` : `共 ${total} 条 · 已显示 ${results.length} 条`,
          expandedQueries: (res && res.expanded_queries) || [],
          releaseId: (res && res.release_id) || '',
          loading: false,
          loadingMore: false,
          error: '',
        });
      })
      .catch((/** @type {any} */ err) => {
        if (mySeq !== seq) return;
        this.setData({
          results: append ? this.data.results : [],
          resultCount: append ? this.data.results.length : 0,
          loading: false,
          loadingMore: false,
          error: err.message || '检索失败',
        });
      });
  },

  onShareAppMessage() {
    return { title: '段言 · 搜段永平原话', path: '/pages/search/search' };
  },
});
