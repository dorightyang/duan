const api = require('./utils/api');

App({
  globalData: {
    // 语料全部来自后端接口；这里只保留启动期需要的信息，不在本地烤数据。
    apiBaseUrl: api.BASE_URL,
    hasApiToken: api.hasToken,
  },
});
