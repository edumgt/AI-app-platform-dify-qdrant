"use client";

export default function OffCanvas() {
  return (
    <>
      <div id="offcanvasOverlay" className="fixed inset-0 z-40 hidden bg-black/40" />
      <aside
        id="offcanvas"
        className="fixed left-0 top-0 z-50 h-full w-72 -translate-x-full border-r bg-white shadow-lg transition-transform duration-200"
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Menu</div>
          <button className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" data-oc-close>
            ✕
          </button>
        </div>
        <nav className="p-3">
          <a className="block rounded px-3 py-2 hover:bg-gray-50" href="/apps">
            AI 앱 목록
          </a>
          <a className="block rounded px-3 py-2 hover:bg-gray-50" href="/keys">
            API 키 관리
          </a>
          <a className="block rounded px-3 py-2 hover:bg-gray-50" href="/me">
            실행 이력
          </a>
          <div className="my-3 border-t" />
          <a className="block rounded px-3 py-2 hover:bg-gray-50" href="/admin">
            관리자
          </a>
          <a className="block rounded px-3 py-2 hover:bg-gray-50" href="/login">
            로그인
          </a>
        </nav>
      </aside>
    </>
  );
}
