"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../components/apiClient";

export default function AppDetail({ params }) {
  const id = params.id;
  const [app, setApp] = useState(null);
  const [query, setQuery] = useState("연차 사용 절차가 뭐야?");
  const [file, setFile] = useState(null);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/api/apps/${id}`)
      .then((d) => setApp(d.item))
      .catch((e) => setErr(e?.data?.error || e.message));
  }, [id]);

  async function run() {
    setErr("");
    setOut(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("query", query);
      form.append("top_k", "5");
      if (file) form.append("file", file);

      const data = await apiFetch(`/api/apps/${id}/run`, {
        method: "POST",
        body: form,
        isForm: true
      });

      setOut(data);
    } catch (e) {
      setErr(e?.data?.message || e?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {err && <div className="mb-3 rounded border bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {!app ? (
        <div className="rounded border bg-white p-4">로딩중...</div>
      ) : (
        <div className="rounded-lg border bg-white p-6">
          <h1 className="text-xl font-semibold">{app.title}</h1>
          <p className="mt-2 text-sm text-gray-700">{app.description}</p>

          <div className="mt-5 space-y-3">
            <div>
              <label className="text-sm text-gray-700">질문</label>
              <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={3} value={query} onChange={(e)=>setQuery(e.target.value)} />
            </div>

            <div>
              <label className="text-sm text-gray-700">파일(선택)</label>
              <input className="mt-1 block w-full text-sm" type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
              <div className="mt-1 text-xs text-gray-500">업로드 파일은 실행 후 즉시 삭제(best-effort) + TTL GC로 만료 파기됩니다.</div>
            </div>

            <button disabled={loading} className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50" onClick={run}>
              {loading ? "실행 중..." : "실행"}
            </button>
          </div>

          {out && (
            <div className="mt-5 rounded border bg-gray-50 p-4">
              <div className="text-sm font-semibold">결과</div>
              <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(out.output, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
