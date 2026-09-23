import { uploadFile } from "@/app/Api";

export const MAX_INLINE_IMAGE_MB = 10;

/**
 * Uploads are stored on the API host (api.chuyenbienhoa.com/storage/...), but
 * the backend builds the URL from APP_URL, which points at the main site.
 * Keep only the /storage/... part and put it under the API host.
 */
export function toApiStorageUrl(path) {
  const storagePath = String(path).replace(/^https?:\/\/[^/]+/, "");
  return `${process.env.NEXT_PUBLIC_API_URL}${storagePath.startsWith("/") ? "" : "/"}${storagePath}`;
}

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem("CURRENT_USER") || "null")?.id;
  } catch {
    return null;
  }
}

/**
 * Uploads one image via /v1.0/upload and resolves to its public URL - the
 * same endpoint and URL shape the admin image field uses.
 *
 * Used for images pasted or dropped *into the body text*, which become
 * inline Markdown images (`![](url)`) rather than post attachments: the
 * attachment list is for files the reader downloads/browses as a gallery,
 * while a pasted screenshot belongs where the caret was.
 *
 * @param {File} file
 * @param {number|string|null} [uid] - Falls back to the cached current user.
 * @returns {Promise<string>} the uploaded image's URL
 */
export async function uploadInlineImage(file, uid) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ hỗ trợ tệp ảnh");
  }
  if (file.size > MAX_INLINE_IMAGE_MB * 1024 * 1024) {
    throw new Error(`Ảnh tối đa ${MAX_INLINE_IMAGE_MB}MB`);
  }

  const formData = new FormData();
  formData.append("file", file);
  const ownerId = uid ?? currentUserId();
  if (ownerId != null) formData.append("uid", ownerId);

  const res = await uploadFile(formData);
  const path = res?.data?.path;
  if (!path) throw new Error("Tải ảnh lên thất bại");
  return toApiStorageUrl(path);
}
