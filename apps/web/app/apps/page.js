"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiClient";

export default function AppsPage() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/apps")
      .then((d) => setItems(d.items || []))
      .catch((e) => setErr(e?.data?.error || e.message));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">AI 앱 목록</h1>
      {err && <div className="mt-3 rounded border bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <a key={a.id} href={`/apps/${a.id}`} className="rounded-lg border bg-white p-4 hover:shadow">
            <div className="text-base font-semibold">{a.title}</div>
            <div className="mt-1 text-sm text-gray-700 line-clamp-2">{a.description}</div>
            <div className="mt-2 text-xs text-gray-500">Plan: {a.plan_required}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
