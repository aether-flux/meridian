const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const TOKEN_STORAGE_KEY = "meridian_token";
const USER_STORAGE_KEY = "meridian_user";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new Event("auth:unauthorized"));
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    const validationDetails = data?.details
      ?.map(({ path, message }) => `${path}: ${message}`)
      .join("; ");
    const message = validationDetails
      ? `${data?.error || "Invalid request"}: ${validationDetails}`
      : data?.error || `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (path, options) =>
    apiRequest(path, { ...options, method: "DELETE" }),
};