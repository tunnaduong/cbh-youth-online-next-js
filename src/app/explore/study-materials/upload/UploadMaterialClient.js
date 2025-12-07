"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { createStudyMaterial, uploadFile, getStudyMaterialCategories } from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import { Book } from "react-ionicons";

export default function UploadMaterialClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: null,
    price: 0,
    is_free: true,
    preview_content: "",
    status: "published",
  });
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [categories, setCategories] = useState([]);

  const sidebarItems = [
    {
      key: "study",
      href: "/explore/study-materials",
      label: "Tài liệu ôn thi",
      Icon: Book,
      isExternal: false,
    },
  ];

  useEffect(() => {
    if (!loggedIn) {
      router.push("/login");
    } else {
      loadCategories();
    }
  }, [loggedIn, router]);

  const loadCategories = async () => {
    try {
      const response = await getStudyMaterialCategories();
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("uid", JSON.parse(localStorage.getItem("CURRENT_USER"))?.id);

      const response = await uploadFile(formData);
      setFileId(response.data.id);
      message.success("Upload file thành công!");
    } catch (err) {
      message.error("Upload file thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fileId) {
      message.warning("Vui lòng upload file tài liệu");
      return;
    }

    if (!formData.title.trim()) {
      message.warning("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      setLoading(true);
      await createStudyMaterial({
        ...formData,
        file_id: fileId,
        price: formData.is_free ? 0 : formData.price,
      });
      message.success("Đăng tài liệu thành công!");
      router.push("/explore/study-materials");
    } catch (err) {
      message.error(err.response?.data?.message || "Đăng tài liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <HomeLayout activeNav="explore" activeBar="study" sidebarItems={sidebarItems}>
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Link
            href="/explore/study-materials"
            className="text-green-600 hover:text-green-700 mb-4 inline-block"
          >
            ← Quay lại danh sách
          </Link>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Đăng tài liệu mới
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  rows="4"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Danh mục</label>
                <select
                  value={formData.category_id || ""}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Chọn danh mục (tùy chọn)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold">File tài liệu *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                  accept=".pdf,.doc,.docx,.txt"
                  required
                />
                {uploading && <p className="text-sm text-gray-500 mt-2">Đang upload...</p>}
                {fileId && (
                  <p className="text-sm text-green-600 mt-2">✓ Upload thành công</p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Nội dung xem trước</label>
                <textarea
                  value={formData.preview_content}
                  onChange={(e) => setFormData({ ...formData, preview_content: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  rows="6"
                  placeholder="Nhập một phần nội dung để người dùng xem trước..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Tài liệu miễn phí</span>
                </label>
              </div>

              {!formData.is_free && (
                <div>
                  <label className="block mb-2 font-semibold">Giá (điểm) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    min="0"
                    required={!formData.is_free}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Đang đăng..." : "Đăng tài liệu"}
                </button>
                <Link
                  href="/explore/study-materials"
                  className="px-6 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600"
                >
                  Hủy
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

