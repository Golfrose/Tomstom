// ดัก fetch ให้วิ่งผ่าน Firebase Functions โดยอัตโนมัติ
const TOMSTOM_TARGET_ORIGIN = "https://tomstom-8-default-rtdb.asia-southeast1.firebasedatabase.app"; // ← แก้เป็น API จริง
const TOMSTOM_PROXY_PATH = "/api/apiProxy";

(function patchFetchForTomstom() {
  if (!("fetch" in window)) return;
  const _fetch = window.fetch.bind(window);

  window.fetch = async function(url, options = {}) {
    try {
      const u = typeof url === "string" ? url : (url && url.url);
      if (typeof u === "string" && u.startsWith(TOMSTOM_TARGET_ORIGIN)) {
        const method = (options.method || "GET").toUpperCase();

        const headers = new Headers(options.headers || {});
        headers.delete("Authorization"); // กันไม่ให้คีย์ฝั่ง client หลุด

        const proxiedUrl = `${TOMSTOM_PROXY_PATH}?url=${encodeURIComponent(u)}`;
        const init = { method, headers };
        if (!["GET", "HEAD"].includes(method) && options.body) {
          init.body = options.body;
        }
        return _fetch(proxiedUrl, init);
      }
    } catch (_) {}
    return _fetch(url, options);
  };
})();
