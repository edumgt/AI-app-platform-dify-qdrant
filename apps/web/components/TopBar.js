"use client";

import Script from "next/script";

export default function TopBar({ title }) {
  return (
    <>
      <Script src="/offcanvas.js" strategy="afterInteractive" />
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            data-oc-open
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="flex-1 text-base font-semibold">{title}</div>
          <a className="text-sm text-gray-600 hover:text-gray-900" href="/apps">
            Apps
          </a>
          <a className="text-sm text-gray-600 hover:text-gray-900" href="/me">
            Me
          </a>
        </div>
      </header>
    </>
  );
}
