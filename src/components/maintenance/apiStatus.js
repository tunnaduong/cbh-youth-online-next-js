const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

export const API_DOWN_EVENT = "cyo:api-down";

// Lỗi mạng (không có response) hoặc lỗi gateway/bảo trì => coi như API đang down
export function isApiDownError(error) {
  if (!error) return false;
  if (error.code === "ERR_CANCELED") return false;
  if (!error.response) return error.code === "ERR_NETWORK" || error.message === "Network Error";
  return [502, 503, 504].includes(error.response.status);
}

export function notifyApiDown() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_DOWN_EVENT));
  }
}

// Trả về true nếu API phản hồi được (kể cả 4xx), false nếu không kết nối được hoặc 5xx
export async function checkApiAlive(timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API_BASE, { cache: "no-store", signal: ctrl.signal });
    return res.status < 500;
  } catch {
    // Có thể chỉ là thiếu CORS ở root - thử lại với no-cors
    try {
      await fetch(API_BASE, { mode: "no-cors", cache: "no-store", signal: ctrl.signal });
      return true;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timer);
  }
}
