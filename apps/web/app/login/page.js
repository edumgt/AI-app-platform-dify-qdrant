"use client";

import { useState } from "react";
import { apiFetch, setToken } from "../../components/apiClient";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login|signup
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("User!2345");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const data = await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        body: { email, password }
      });
      setToken(data.access_token);
      setMsg("OK! 이동합니다...");
      window.location.href = "/apps";
    } catch (err) {
      setMsg(err?.data?.error || err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6">
      <h1 className="text-lg font-semibold">{mode === "login" ? "로그인" : "회원가입"}</h1>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Password</label>
          <input type="password" className="mt-1 w-full rounded-md border px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>

        <button className="w-full rounded-md bg-black px-4 py-2 text-sm text-white">
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>

      <div className="mt-3 text-sm text-gray-600">
        {mode === "login" ? (
          <button className="underline" onClick={()=>setMode("signup")}>회원가입으로</button>
        ) : (
          <button className="underline" onClick={()=>setMode("login")}>로그인으로</button>
        )}
      </div>

      {msg && <div className="mt-3 rounded border bg-gray-50 p-2 text-sm">{msg}</div>}
    </div>
  );
}
