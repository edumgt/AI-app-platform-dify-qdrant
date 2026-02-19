"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiClient";

export default function MePage() {
  const [runs, setRuns] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/apps/me/runs")
      .then((d)=>setRuns(d.items || []))
      .catch((e)=>setErr(e?.data?.error || e.message));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">실행 이력</h1>
      {err && <div className="mt-3 rounded border bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-4 space-y-3">
        {runs.map((r) => (
          <div key={r.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.title} <span className="text-xs text-gray-500">({r.slug})</span></div>
              <div className="text-xs text-gray-500">{new Date(r.started_at).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs">
              <span className="rounded bg-gray-100 px-2 py-1">{r.status}</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-700">상세</summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(r.outputs, null, 2)}</pre>
            </details>
          </div>
        ))}
        {runs.length === 0 && <div className="rounded border bg-white p-4 text-sm text-gray-600">실행 이력이 없습니다. 앱을 실행해보세요.</div>}
      </div>
    </div>
  );
}
