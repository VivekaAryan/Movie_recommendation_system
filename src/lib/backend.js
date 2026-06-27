const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export function backendErrorStatus(error, fallbackStatus = 502) {
  if (error.response) {
    return error.response.status;
  }
  return fallbackStatus;
}

export function backendErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  if (error.code === "ECONNREFUSED") {
    return "Backend unavailable. Start the app with: npm run dev";
  }
  return error.message || "Backend unavailable";
}

export { BACKEND_URL };
