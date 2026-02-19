"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiClient";

export default function KeysPage() {
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    apiFetch("/api/keys")
      .then((d)=>setItems(d.items || []))
      .catch((e)=>setMsg(e?.data?.error || e.message));
  }

  useEffect(() => { load(); }, []);

  async function addKey() {
    setMsg("");
    try {
      await apiFetch("/api/keys", { method: "POST", body: { provider, api_key: apiKey } });
      setApiKey("");
      load();
      setMsg("등록 완료");
    } catch (e) {
      setMsg(e?.data?.error || e.message);
    }
  }

  async function del(id) {
    setMsg("");
    try {
      await apiFetch(`/api/keys/${id}`, { method: "DELETE" });
      load();
      setMsg("삭제 완료");
    } catch (e) {
      setMsg(e?.data?.error || e.message);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">외부 서비스 API 키 관리</h1>
      <p className="mt-1 text-sm text-gray-700">키는 암호화 저장되며, 화면에는 힌트만 표시됩니다.</p>

      <div className="mt-4 rounded-lg border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-sm text-gray-700">Provider</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={provider} onChange={(e)=>setProvider(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-700">API Key</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="sk-..." />
          </div>
        </div>
        <button className="mt-3 rounded-md bg-black px-4 py-2 text-sm text-white" onClick={addKey}>등록</button>
        {msg && <div className="mt-3 rounded border bg-gray-50 p-2 text-sm">{msg}</div>}
      </div>

      <div className="mt-4 space-y-3">
        {items.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <div className="font-semibold">{k.provider}</div>
              <div className="text-sm text-gray-600">{k.key_hint}</div>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>del(k.id)}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
