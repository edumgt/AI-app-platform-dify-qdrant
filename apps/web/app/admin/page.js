"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiClient";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const u = await apiFetch("/api/admin/users");
      const a = await apiFetch("/api/admin/apps");
      setUsers(u.items || []);
      setApps(a.items || []);
    } catch (e) {
      setMsg("관리자 권한이 필요합니다. admin@example.com 으로 로그인하세요.");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">관리자</h1>
      {msg && <div className="mt-3 rounded border bg-yellow-50 p-3 text-sm text-yellow-800">{msg}</div>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">회원</h2>
          <div className="mt-3 space-y-2">
            {users.slice(0, 10).map(u => (
              <div key={u.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-semibold">{u.email}</div>
                  <div className="text-xs text-gray-500">{u.role} / {u.status}</div>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-sm text-gray-600">조회 불가</div>}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">AI 앱</h2>
          <div className="mt-3 space-y-2">
            {apps.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.slug}</div>
                </div>
                <div className="text-xs text-gray-500">{a.is_published ? "published" : "hidden"}</div>
              </div>
            ))}
            {apps.length === 0 && <div className="text-sm text-gray-600">조회 불가</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
