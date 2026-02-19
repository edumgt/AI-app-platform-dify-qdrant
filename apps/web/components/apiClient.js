export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(t) {
  if (typeof window === "undefined") return;
  if (!t) localStorage.removeItem("access_token");
  else localStorage.setItem("access_token", t);
}

export async function apiFetch(path, { method = "GET", body, headers, isForm } = {}) {
  const base = getApiBase();
  const token = getToken();
  const h = headers ? { ...headers } : {};
  if (!isForm) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;

  const res = await fetch(base + path, {
    method,
    headers: h,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    credentials: "include"
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || "request_failed");
    err.data = data;
    throw err;
  }
  return data;
}
