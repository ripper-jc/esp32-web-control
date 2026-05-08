const API_URL = (import.meta.env.VITE_API_URL as string) || "";

let authToken: string | null = localStorage.getItem("auth_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setAuthToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `${options?.method || "GET"} ${path} failed (${res.status})`;
    try {
      const errBody = await res.text();
      const parsed = JSON.parse(errBody);
      if (parsed.message) message = parsed.message;
    } catch (_) {}
    throw new Error(message);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function apiSignIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    let message = "Login failed";
    try {
      const parsed = JSON.parse(body);
      message = parsed.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
