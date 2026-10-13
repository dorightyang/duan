const api = require('../../utils/api');
const { toTopicItem, topperVisible } = require('../../utils/view');
const { toTop } = require('../../utils/scroll');

Page({
  data: {
    topicId: '',
    /** @type {any} */
    topic: null,
    /** @type {any[]} */
    items: [],
    loading: true,
    error: '',
    /** 滚过一屏后右下角出现「回到顶部」 */
    showToTop: false,
  },

  /** 模板里的「回到顶部」绑到这里 */
  toTop,

  /** @param {{ scrollTop: number }} e */
  onPageScroll(e) {
    const show = topperVisible(e.scrollTop);
    if (show !== this.data.showToTop) this.setData({ showToTop: show });
  },

  /** @param {{ topicId?: string }} query */
  onLoad(query) {
    const topicId = (query && query.topicId) || '';
    if (!topicId) {
      this.setData({ loading: false, error: '缺少专题参数' });
      return;
    }
    this.setData({ topicId });
    this.load();
  },

  load() {
    this.setData({ loading: true, error: '' });
    api
      .topic(this.data.topicId)
      /** @param {any} topic */
      .then((topic) => {
        const items = (topic && topic.items) || [];
        this.setData({
          topic: {
            title: (topic && topic.title) || '',
            version: (topic && topic.version) || '',
            itemCount: items.length,
          },
          items: items.map((/** @type {any} */ it) => toTopicItem(it, (topic && topic.title) || '')),
          loading: false,
        });
      })
      .catch((/** @type {any} */ err) => this.setData({ loading: false, error: err.message || '打开失败' }));
  },

  /** @param {{ currentTarget: { dataset: { index: string } } }} event */
  onTapItem(event) {
    const row = this.data.items[Number(event.currentTarget.dataset.index)];
    if (!row || !row.docId) return;
    wx.navigateTo({
      url: `/pages/reader/reader?docId=${row.docId}&segmentId=${encodeURIComponent(row.segmentId || '')}`,
    });
  },

  onShareAppMessage() {
    return { title: `段言 · ${(this.data.topic && this.data.topic.title) || '专题'}`, path: `/pages/topic/topic?topicId=${this.data.topicId}` };
  },
});
