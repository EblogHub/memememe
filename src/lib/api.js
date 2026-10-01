export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
      body: options.body && !isFormData && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
    });
  } catch {
    throw new ApiError("Campus services are offline. Registration and trading will be available when the API is connected.", 0);
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status >= 500
      ? "Campus services are offline. Registration and trading will be available when the API is connected."
      : payload.error || "The request could not be completed.";
    throw new ApiError(message, response.status);
  }
  return payload;
}
