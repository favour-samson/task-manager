import { AuthResponse, Task, TaskFormData, User } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !endpoint.startsWith("/api/auth")) {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const data: AuthResponse = await refreshRes.json();
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${data.token}` },
        credentials: "include",
      });

      if (!retryRes.ok) {
        const err = await retryRes.json();
        throw new Error(err.message || "Request failed");
      }
      return retryRes.json() as Promise<T>;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Request failed");
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),
};

export const taskApi = {
  getAll: () => request<Task[]>("/api/tasks"),

  create: (data: TaskFormData) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<TaskFormData>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/tasks/${id}`, { method: "DELETE" }),
};

export const userApi = {
  getAll: () => request<User[]>("/api/users"),
};
