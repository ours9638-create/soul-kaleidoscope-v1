(() => {
  "use strict";

  const PREFIX = "soul-kaleidoscope.report-preview.";
  const MAX_PREVIEWS = 10;
  const TTL_MS = 24 * 60 * 60 * 1000;
  const button = document.getElementById("openReportBtn");
  const toast = document.getElementById("toast");

  if (!button) return;

  function showToast(message) {
    if (!toast) return window.alert(message);
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function createToken() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `report-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function cleanupPreviews() {
    const entries = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const payload = JSON.parse(localStorage.getItem(key));
        if (!payload || Number(payload.expiresAt) < Date.now()) {
          localStorage.removeItem(key);
          index -= 1;
          continue;
        }
        entries.push({ key, createdAt: Number(payload.createdAtMs || 0) });
      } catch {
        localStorage.removeItem(key);
        index -= 1;
      }
    }
    entries.sort((a, b) => b.createdAt - a.createdAt);
    for (const entry of entries.slice(MAX_PREVIEWS)) localStorage.removeItem(entry.key);
  }

  button.addEventListener("click", () => {
    const profile = window.__SOUL_PROFILE__;
    if (!profile?.outputs?.report) {
      showToast("請先完成計算，再開啟報告");
      return;
    }

    try {
      cleanupPreviews();
      const token = createToken();
      const now = Date.now();
      localStorage.setItem(`${PREFIX}${token}`, JSON.stringify({
        version: 1,
        createdAt: new Date(now).toISOString(),
        createdAtMs: now,
        expiresAt: now + TTL_MS,
        profile
      }));

      const url = new URL("report.html", window.location.href);
      url.hash = token;
      const reportWindow = window.open(url.toString(), "_blank");
      if (!reportWindow) {
        showToast("瀏覽器阻擋了新分頁，請允許彈出式視窗後再試");
        return;
      }
      reportWindow.opener = null;
      showToast("報告已在新分頁開啟");
    } catch (error) {
      showToast(error?.name === "QuotaExceededError" ? "本機儲存空間不足，無法建立報告預覽" : "無法建立報告預覽");
    }
  });
})();
