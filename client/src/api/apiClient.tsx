type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

type ApiCommandOptions<TPayload = unknown> = {
  endpoint: string;
  method?: HttpMethod;
  payload?: TPayload;
  headers?: Record<string, string>;
  requireAuth?: boolean;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const ACCESS_TOKEN_KEY = "ingester-access-token";

export function getStoredAccessToken() {
  return typeof window === "undefined"
    ? ""
    : window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setStoredAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAuth() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem("ingester-current-user");
  window.localStorage.removeItem("ingester-session");
}

export async function apiCommand<TResponse = unknown, TPayload = unknown>(
  options: ApiCommandOptions<TPayload>
): Promise<TResponse> {
  const {
    endpoint,
    method = "GET",
    payload,
    headers = {},
    requireAuth = false,
  } = options;

  const isFormData = payload instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  const accessToken = getStoredAccessToken();

  if (requireAuth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (!isFormData && !requestHeaders["Content-Type"] && payload !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }
console.log("API URL:", `${API_BASE_URL}${endpoint}`);
console.log("METHOD:", method);
console.log("PAYLOAD:", payload);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    credentials: "include",
    headers: requestHeaders,
    body:
      payload === undefined || payload === null
        ? undefined
        : isFormData
          ? payload
          : JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(". ")
      : undefined;

    const errorMessage =
      typeof data === "string"
        ? data
       : detail || data?.message || `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return data as TResponse;
}

export default apiCommand;
 