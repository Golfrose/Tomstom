// fetch-shim.js
// This shim intercepts fetch requests to the Firebase Realtime Database
// endpoint and routes them through a proxy. It is copied directly
// from the original Tomstom project. You typically won't need to
// modify this unless you change the database URL or your proxy path.

const TOMSTOM_TARGET_ORIGIN = "https://tomstom-8-default-rtdb.asia-southeast1.firebasedatabase.app";
const TOMSTOM_PROXY_PATH = "/api/apiProxy";

(function patchFetchForTomstom() {
  if (!('fetch' in window)) return;
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (url, options = {}) {
    try {
      const u = typeof url === 'string' ? url : (url && url.url);
      if (typeof u === 'string' && u.startsWith(TOMSTOM_TARGET_ORIGIN)) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = new Headers(options.headers || {});
        // Remove Authorization header to avoid leaking client keys
        headers.delete('Authorization');
        const proxiedUrl = `${TOMSTOM_PROXY_PATH}?url=${encodeURIComponent(u)}`;
        const init = { method, headers };
        if (!['GET', 'HEAD'].includes(method) && options.body) {
          init.body = options.body;
        }
        return _fetch(proxiedUrl, init);
      }
    } catch (err) {
      // fall through to default fetch
    }
    return _fetch(url, options);
  };
})();
