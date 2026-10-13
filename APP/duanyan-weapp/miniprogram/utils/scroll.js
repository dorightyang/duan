/**
 * 一键回到页面顶部。搜索结果 / 原文 / 专题共用，
 * 由 templates/back-to-top.wxml 里的 bindtap="toTop" 触发。
 */
function toTop() {
  wx.pageScrollTo({ scrollTop: 0, duration: 260 });
}

module.exports = { toTop };
