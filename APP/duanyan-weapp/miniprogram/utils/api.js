/**
 * 段言后端 API 客户端。
 *
 * - 只读展示，零生成：接口返回的都是库内原文。
 * - baseUrl/token 从 `miniprogram/config.js` 读（公开发布副本里是占位值）。
 *   没填 baseUrl 时不会发请求，直接给出「请先配置后端」的提示。
 */

/** @type {{ baseUrl?: string, token?: string }} */
let local = {};
try {
  local = require('../config.js');
} catch (err) {
  local = {};
}

const BASE_URL = local.baseUrl || '';
const TOKEN = local.token || '';
const KB = 'duan';

/**
 * @param {string} path
 * @param {{ method?: 'GET'|'POST', data?: any, timeout?: number }} [options]
 * @returns {Promise<any>}
 */
function request(path, options) {
  const opts = options || {};
  return new Promise((resolve, reject) => {
    if (!BASE_URL) {
      reject(new Error('还没配后端：请编辑 miniprogram/config.js 里的 baseUrl'));
      return;
    }
    wx.request({
      url: BASE_URL + path,
      method: opts.method || 'GET',
      data: opts.data,
      header: { 'X-API-Token': TOKEN, 'Content-Type': 'application/json' },
      timeout: opts.timeout || 15000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const body = /** @type {any} */ (res.data);
          const raw = body && (body.detail || body.error);
          const message = (raw && (raw.message || raw.code)) || `服务返回 ${res.statusCode}`;
          reject(Object.assign(new Error(String(message)), { statusCode: res.statusCode, body }));
        }
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '网络请求失败'));
      },
    });
  });
}

const KB_QUERY = `kbs=${KB}`;

module.exports = {
  BASE_URL,
  hasToken: Boolean(TOKEN),
  health: () => request('/health'),
  coverage: () => request(`/api/v1/duanyan/coverage?${KB_QUERY}`),
  people: () => request(`/api/v1/duanyan/people?${KB_QUERY}`),
  /**
   * @param {{ query: string, mode?: 'keywords'|'phrase', personIds?: string[],
   *   dateFrom?: string|null, dateTo?: string|null, sort?: string, pageSize?: number,
   *   offset?: number }} opts
   */
  search: (opts) =>
    request('/api/v1/retrieve/passages', {
      method: 'POST',
      timeout: 20000,
      data: {
        contract_version: 2,
        kbs: [KB],
        query: opts.query,
        mode: opts.mode || 'keywords',
        person_ids: opts.personIds || [],
        date: { from: opts.dateFrom || null, to: opts.dateTo || null },
        sort: opts.sort || 'relevance',
        page_size: opts.pageSize || 20,
        offset: opts.offset || 0,
      },
    }),
  /** @param {string} docId */
  document: (docId) => request(`/api/v1/duanyan/documents/${docId}?${KB_QUERY}`),
  /**
   * @param {string} docId
   * @param {{ aroundSegmentId?: string, beforeCursor?: number|null, afterCursor?: number|null, limit?: number,
   *   onlyOwner?: boolean }} [opts]
   */
  blocks: (docId, opts) => {
    const o = opts || {};
    const parts = [KB_QUERY];
    if (o.onlyOwner) parts.push('only_owner=true');
    if (o.aroundSegmentId) parts.push(`around_segment_id=${encodeURIComponent(o.aroundSegmentId)}`);
    if (o.beforeCursor !== undefined && o.beforeCursor !== null) parts.push(`before_cursor=${o.beforeCursor}`);
    if (o.afterCursor !== undefined && o.afterCursor !== null) parts.push(`after_cursor=${o.afterCursor}`);
    if (o.limit) parts.push(`limit=${o.limit}`);
    return request(`/api/v1/duanyan/documents/${docId}/blocks?${parts.join('&')}`);
  },
  /** @param {string} segmentId */
  context: (segmentId) =>
    request(`/api/v1/duanyan/contexts/${encodeURIComponent(segmentId)}?${KB_QUERY}`),
  topics: () => request(`/api/v1/duanyan/topics?${KB_QUERY}`),
  /** @param {string} topicId */
  topic: (topicId) => request(`/api/v1/duanyan/topics/${encodeURIComponent(topicId)}?${KB_QUERY}`),
  /** @param {any} payload */
  feedback: (payload) =>
    request('/api/v1/duanyan/feedback', { method: 'POST', data: Object.assign({ kbs: [KB] }, payload) }),
};
