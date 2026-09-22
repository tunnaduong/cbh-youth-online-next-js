const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

export const API_DOWN_EVENT = "cyo:api-down";

// Lỗi mạng (không có response) hoặc bất kỳ lỗi 5xx nào => coi như API đang down
export function isApiDownError(error) {
  if (!error) return false;
  if (error.code === "ERR_CANCELED") return false;
  if (!error.response) return error.code === "ERR_NETWORK" || error.message === "Network Error";
  return error.response.status >= 500;
}

export function notifyApiDown() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_DOWN_EVENT));
  }
}

// Health check qua một endpoint có truy vấn DB (trang gốc của Laravel vẫn 200 kể cả khi DB chết).
// Trả về true nếu API phản hồi < 500, false nếu không kết nối được hoặc 5xx.
const HEALTH_PATH = "/v1.0/forum/categories";

export async function checkApiAlive(timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API_BASE + HEALTH_PATH, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
