const api = require('../../utils/api');
const { sourceName } = require('../../utils/view');

Page({
  data: {
    people: [],
    sources: [],
    error: '',
  },

  onLoad() {
    api
      .coverage()
      /** @param {any} cov */
      .then((cov) => {
        this.setData({
          people: ((cov && cov.people) || []).filter(
            (/** @type {any} */ p) => p.segments > 0 || p.documents > 0,
          ),
          sources: ((cov && cov.sources) || []).map((/** @type {any} */ s) => ({
            name: sourceName(s.source_type),
            documents: s.documents,
          })),
        });
      })
      .catch((/** @type {any} */ err) => this.setData({ error: err.message || '读取失败' }));
  },

  onShareAppMessage() {
    return { title: '关于段言', path: '/pages/about/about' };
  },
});
