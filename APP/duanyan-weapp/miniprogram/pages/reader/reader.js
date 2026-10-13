const api = require('../../utils/api');
const { toBlock, docLevelDefects, timecode, sourceName, tierName, topperVisible, isArticleDoc, titleRepeatedInBlocks } = require('../../utils/view');
// 纯滚动那一版（不做补页），给"已经在文首"和失败兜底用；下面 Page.toTop 是它的包装
const { toTop: scrollToTop } = require('../../utils/scroll');

/** 原文一页多少段（首屏 / 向上补页 / 向下补页都用它，别各写各的） */
const PAGE_SIZE = 30;

Page({
  data: {
    docId: '',
    hitSegmentId: '',
    /** @type {any} */
    doc: null,
    /** @type {any} */
    header: null,
    /** @type {any[]} */
    blocks: [],
    /** @type {string[]} 文档级缺陷（每段都带的那几条）：只在页首提示一次，不跟着卡片重复 */
    docDefects: [],
    hasMoreBefore: false,
    hasMoreAfter: false,
    beforeCursor: null,
    afterCursor: null,
    isEnd: false,
    /** 访谈/演讲转录稿：整篇按一篇文章排（一张卡、段间小间距），不一段一卡 */
    article: false,
    loading: true,
    loadingMore: false,
    error: '',
    /** 滚过一屏后右下角出现「回到顶部」 */
    showToTop: false,
    /** 「回到顶部」正在换到文首页（挡住连点） */
    toTopBusy: false,
  },

  /**
   * 「回到顶部」（templates/back-to-top.wxml 绑的就是这个名）。
   *
   * 原文是分页加载的：从搜索结果进来时窗口是"命中段前 / 后各若干段"，此时页面位置 0 并不是
   * 文档开头，而是「加载更早的段落」那个按钮——点回顶部就停在这儿（用户 2026-10-04 反馈：
   * "没有办法回到顶部，因为它遇到了那个加载更多的段落"）。
   *
   * 所以这里不是 `scrollTo(0)` 了事，而是把窗口换成**文首那一页**：
   * 一次请求就落到真正的顶部，而不是替用户把中间几百段全拉进来
   * （实测最长文档 845 段，全量加载要几秒，也违背"原文分页"存在的理由）。
   * 代价：原来停在中间的那一屏会被换掉，往下翻要用「加载后续段落」——
   * 这是"一律跳到文首"这个一致行为换来的，不做"看文档大小决定加载还是跳转"的双路径。
   */
  toTop() {
    if (!this.data.hasMoreBefore) {
      scrollToTop();
      return;
    }
    if (this.data.toTopBusy) return;
    this.setData({ toTopBusy: true });
    wx.showLoading({ title: '回到顶部…', mask: true });
    api
      // 不带游标 = 文档第一页（接口实测：has_more_before=false）
      .blocks(this.data.docId, { limit: PAGE_SIZE, onlyOwner: true })
      /** @param {any} page */
      .then((page) => {
        this.setData({
          blocks: (page.blocks || []).map((/** @type {any} */ b) => toBlock(b, this.data.docDefects)),
          hasMoreBefore: page.has_more_before,
          hasMoreAfter: page.has_more_after,
          beforeCursor: page.before_cursor,
          afterCursor: page.after_cursor,
          isEnd: page.is_end,
          toTopBusy: false,
        });
        wx.hideLoading();
        scrollToTop();
      })
      .catch(() => {
        // 取不到文首就别把用户困在原地：至少滚到当前这一页的顶
        wx.hideLoading();
        this.setData({ toTopBusy: false });
        scrollToTop();
      });
  },

  /** @param {{ scrollTop: number }} e */
  onPageScroll(e) {
    const show = topperVisible(e.scrollTop);
    if (show !== this.data.showToTop) this.setData({ showToTop: show });
  },

  /** @param {{ docId?: string, segmentId?: string }} query */
  onLoad(query) {
    const docId = (query && query.docId) || '';
    const hitSegmentId = (query && query.segmentId) || '';
    if (!docId) {
      this.setData({ loading: false, error: '缺少文档参数' });
      return;
    }
    this.setData({ docId, hitSegmentId });
    this.load();
  },

  load() {
    this.setData({ loading: true, error: '' });
    const { docId, hitSegmentId } = this.data;
    Promise.all([
      api.document(docId),
      api.blocks(docId, { aroundSegmentId: hitSegmentId || undefined, limit: PAGE_SIZE, onlyOwner: true }),
    ])
      /** @param {any[]} results */
      .then(([doc, blockPage]) => {
        const docDefects = docLevelDefects(doc.toc);
        const blocks = (blockPage.blocks || []).map((/** @type {any} */ b) => toBlock(b, docDefects));
        this.setData({
          doc,
          article: isArticleDoc(doc),
          docDefects,
          header: {
            // 标题已经在正文里出现过（逐字相同或就是正文开头）就不再印一次，避免打断问答顺序
            title: titleRepeatedInBlocks(doc.title, blocks) ? '' : doc.title,
            sourceName: sourceName(doc.source_type),
            tierLabel: tierName(doc.source_tier),
            dateLabel: doc.date_label || '',
            series: doc.series || '',
            url: doc.original_url || '',
            publisher: (doc.publisher && doc.publisher.name) || '',
            warnings: docDefects,
          },
          blocks,
          hasMoreBefore: blockPage.has_more_before,
          hasMoreAfter: blockPage.has_more_after,
          beforeCursor: blockPage.before_cursor,
          afterCursor: blockPage.after_cursor,
          isEnd: blockPage.is_end,
          loading: false,
        });
        this.scrollToHit();
      })
      .catch((/** @type {any} */ err) => this.setData({ loading: false, error: err.message || '打开失败' }));
  },

  onTapMoreBefore() {
    this.loadMore('before');
  },

  onTapMoreAfter() {
    this.loadMore('after');
  },

  /** @param {'before'|'after'} dir */
  loadMore(dir) {
    if (this.data.loadingMore) return;
    this.setData({ loadingMore: true });
    /** @type {{ beforeCursor?: number|null, afterCursor?: number|null, limit: number }} */
    const opts = dir === 'before'
      ? { beforeCursor: this.data.beforeCursor, limit: PAGE_SIZE }
      : { afterCursor: this.data.afterCursor, limit: PAGE_SIZE };
    api
      .blocks(this.data.docId, Object.assign({ onlyOwner: true }, opts))
      /** @param {any} page */
      .then((page) => {
        const incoming = (page.blocks || []).map((/** @type {any} */ b) => toBlock(b, this.data.docDefects));
        this.setData({
          blocks: dir === 'before' ? incoming.concat(this.data.blocks) : this.data.blocks.concat(incoming),
          hasMoreBefore: page.has_more_before,
          hasMoreAfter: page.has_more_after,
          beforeCursor: page.before_cursor,
          afterCursor: page.after_cursor,
          isEnd: page.is_end,
          loadingMore: false,
        });
      })
      .catch(() => this.setData({ loadingMore: false }));
  },

  /**
   * 把「你搜的那一句」滚进视口上方留白处。
   * 点搜索结果进来，第一眼就该看到那句话——而不是自己在整篇里翻（用户 2026-09-29 验收意见）。
   */
  scrollToHit() {
    const { hitSegmentId, blocks } = this.data;
    if (!hitSegmentId) return;
    const index = blocks.findIndex((/** @type {any} */ b) => b.segmentId === hitSegmentId);
    if (index < 0) return;
    const query = wx.createSelectorQuery();
    query.selectViewport().scrollOffset();
    query.select(`#block-${index}`).boundingClientRect();
    query.exec((res) => {
      const viewport = res && res[0];
      const rect = res && res[1];
      if (!rect) return;
      const top = ((viewport && viewport.scrollTop) || 0) + rect.top - 96;
      wx.pageScrollTo({ scrollTop: Math.max(0, top), duration: 0 });
    });
  },

  onTapSource() {
    const url = this.data.header && this.data.header.url;
    if (!url) {
      wx.showToast({ title: '本篇无原文链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '原文链接已复制', icon: 'none' }),
    });
  },

  onTapFeedback() {
    const { docId, hitSegmentId } = this.data;
    wx.showModal({
      title: '报错 / 纠错',
      editable: true,
      placeholderText: '哪里不对？例如出处、日期、署名…',
      success: (res) => {
        if (!res.confirm) return;
        api
          .feedback({
            target_type: hitSegmentId ? 'segment' : 'document',
            target_id: hitSegmentId || docId,
            reason: 'user_report',
            note: res.content || '',
          })
          .then(() => wx.showToast({ title: '已收到，谢谢', icon: 'none' }))
          .catch(() => wx.showToast({ title: '提交失败', icon: 'none' }));
      },
    });
  },

  timecode,
});
