// Shared by the admin print-request list and detail pages.

export const STATUS_CONFIG = {
  pending: { color: "orange", label: "Chờ duyệt" },
  approved: { color: "blue", label: "Đã duyệt" },
  printing: { color: "cyan", label: "Đang in" },
  ready: { color: "green", label: "Sẵn sàng" },
  delivered: { color: "green", label: "Đã giao" },
  picked_up: { color: "green", label: "Đã nhận" },
  cancelled: { color: "default", label: "Đã hủy" },
  rejected: { color: "red", label: "Bị từ chối" },
};

// Same state machine as the API (Admin\PrintRequestController::updateStatus).
export const STATUS_TRANSITIONS = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["printing", "rejected", "cancelled"],
  printing: ["ready", "cancelled"],
  ready: ["delivered", "picked_up", "cancelled"],
  delivered: [],
  picked_up: [],
  cancelled: [],
  rejected: [],
};

// What the button that moves a request INTO a status says.
export const ACTION_LABEL = {
  approved: "Duyệt yêu cầu",
  printing: "Bắt đầu in",
  ready: "Đã in xong",
  delivered: "Đã giao tới lớp",
  picked_up: "Đã nhận tại văn phòng",
  rejected: "Từ chối",
  cancelled: "Hủy yêu cầu",
};

export const DELIVERY_METHOD_LABEL = {
  delivery_to_class: "Giao tới lớp",
  pickup_at_office: "Nhận tại văn phòng",
};

export const CARD =
  "bg-white dark:bg-neutral-800 rounded-2xl border border-[#eef0ee] dark:border-neutral-700 shadow-[0_1px_2px_rgba(16,24,16,0.04)]";

const OFFICE_EXT = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp"];

export function fileExtension(file) {
  const name = file?.file_name || file?.file_path || "";
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** "pdf" | "image" | "office" | "other" | null (no file). */
export function fileKind(file) {
  if (!file) return null;
  const ext = fileExtension(file);
  const type = file.file_type || "";
  if (ext === "pdf" || type === "application/pdf") return "pdf";
  if (IMAGE_EXT.includes(ext) || type.startsWith("image/")) return "image";
  if (OFFICE_EXT.includes(ext)) return "office";
  return "other";
}

export function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Public address of the stored file (what the Office viewer fetches). */
export function publicFileUrl(file) {
  if (!file?.file_path) return null;
  const base = process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";
  return `${base}/storage/${file.file_path.replace(/^\/+/, "")}`;
}
