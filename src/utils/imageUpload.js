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

// The backend files uploads by the extension of the name it's given, and an
// image straight off the clipboard often arrives as a bare "image" or with no
// name at all. Give it one derived from its MIME type so a pasted screenshot
// lands in /storage/images (and gets the compression job) like a picked file.
function withImageExtension(file) {
  const subtype = (file.type.split("/")[1] || "png").toLowerCase();
  const ext = subtype === "jpeg" ? "jpg" : subtype.replace(/[^a-z0-9]/g, "");
  const name = file.name || "";
  if (name.toLowerCase().endsWith(`.${ext}`)) return file;
  const base = name.replace(/\.[^.]*$/, "") || "anh-dan";
  return new File([file], `${base}.${ext}`, { type: file.type });
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

  const ownerId = uid ?? currentUserId();
  if (ownerId == null) throw new Error("Bạn cần đăng nhập để tải ảnh lên");

  const formData = new FormData();
  formData.append("file", withImageExtension(file));
  formData.append("uid", ownerId);

  const res = await uploadFile(formData);
  const path = res?.data?.path;
  if (!path) throw new Error("Tải ảnh lên thất bại");
  return toApiStorageUrl(path);
}

/**
 * Image files on a clipboard/drag payload.
 *
 * DataTransfer.files is empty for a clipboard paste on iOS Safari (and on
 * some Android keyboards' image insertion) - there the image is only
 * reachable through .items, so try both. Both lists are live only for the
 * duration of the event, hence the synchronous read.
 *
 * @param {DataTransfer|null} dataTransfer
 * @returns {File[]}
 */
export function collectImageFiles(dataTransfer) {
  if (!dataTransfer) return [];

  const fromFiles = Array.from(dataTransfer.files || []).filter((file) =>
    file.type.startsWith("image/")
  );
  if (fromFiles.length > 0) return fromFiles;

  return Array.from(dataTransfer.items || [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file) => file && file.type.startsWith("image/"));
}
