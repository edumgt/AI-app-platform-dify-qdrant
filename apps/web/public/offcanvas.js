(function () {
  function qs(sel) { return document.querySelector(sel); }
  function open() {
    const panel = qs("#offcanvas");
    const overlay = qs("#offcanvasOverlay");
    if (!panel || !overlay) return;
    panel.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  }
  function close() {
    const panel = qs("#offcanvas");
    const overlay = qs("#offcanvasOverlay");
    if (!panel || !overlay) return;
    panel.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  }
  window.__oc_open = open;
  window.__oc_close = close;

  document.addEventListener("click", function (e) {
    const t = e.target;
    if (!t) return;
    if (t.closest && t.closest("[data-oc-open]")) open();
    if (t.closest && t.closest("[data-oc-close]")) close();
    if (t.id === "offcanvasOverlay") close();
  });
})();
