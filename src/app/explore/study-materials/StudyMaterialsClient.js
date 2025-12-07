"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import * as Api from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import {
  BookOutline,
  Book,
  SearchOutline,
  Search,
  AddOutline,
  Add,
} from "react-ionicons";

export default function StudyMaterialsClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [isFree, setIsFree] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    has_more_pages: true,
  });

  const sidebarItems = [
    {
      key: "study",
      href: "/explore/study-materials",
      label: "Tài liệu ôn thi",
      Icon: Book,
      isExternal: false,
    },
  ];

  const loadMaterials = useCallback(
    async (page = 1, reset = false) => {
      console.log(Api);
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
        });
        if (search) params.append("search", search);
        if (categoryId) params.append("category_id", categoryId);
        if (isFree !== null) params.append("is_free", isFree.toString());

        const response = await getStudyMaterials(params.toString());

        // Handle Laravel pagination format
        const responseData = response.data;
        const data = responseData.data || [];
        const current_page = responseData.current_page || 1;
        const last_page = responseData.last_page || 1;

        if (reset) {
          setMaterials(data);
        } else {
          setMaterials((prev) => [...prev, ...data]);
        }

        setPagination({
          current_page: parseInt(current_page) || 1,
          has_more_pages: parseInt(current_page) < parseInt(last_page),
        });
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải tài liệu";
        message.error(errorMessage);
        console.error("Error loading materials:", err);
        if (err.response?.data?.error) {
          console.error("API Error:", err.response.data);
        }
      } finally {
        setLoading(false);
      }
    },
    [search, categoryId, isFree]
  );

  useEffect(() => {
    loadCategories();
    loadMaterials(1, true);
  }, []);

  useEffect(() => {
    loadMaterials(1, true);
  }, [search, categoryId, isFree]);

  const loadCategories = async () => {
    try {
      const response = await getStudyMaterialCategories();
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="study"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tài liệu ôn thi
            </h1>
            {loggedIn && (
              <Link
                href="/explore/study-materials/upload"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <AddOutline color="#fff" height="20px" width="20px" />
                <span>Đăng tài liệu</span>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <SearchOutline
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                color="#9ca3af"
                height="20px"
                width="20px"
              />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsFree(null)}
                className={`px-4 py-2 rounded-lg ${
                  isFree === null
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setIsFree(true)}
                className={`px-4 py-2 rounded-lg ${
                  isFree === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Miễn phí
              </button>
              <button
                onClick={() => setIsFree(false)}
                className={`px-4 py-2 rounded-lg ${
                  isFree === false
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Trả phí
              </button>
            </div>
          </div>

          {/* Materials List */}
          {loading && materials.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Không tìm thấy tài liệu nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/explore/study-materials/${material.id}`}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-md p-6 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {material.title}
                    </h3>
                    {material.is_free ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded">
                        {material.price} điểm
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {material.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {material.author.profile_name || material.author.username}
                    </span>
                    <div className="flex items-center gap-4">
                      <span>📥 {material.download_count}</span>
                      <span>👁️ {material.view_count}</span>
                      {material.average_rating > 0 && (
                        <span>⭐ {material.average_rating}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Load More */}
          {pagination.has_more_pages && (
            <div className="text-center mt-8">
              <button
                onClick={() =>
                  loadMaterials(pagination.current_page + 1, false)
                }
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Đang tải..." : "Tải thêm"}
              </button>
            </div>
          )}
        </main>
      </div>
    </HomeLayout>
  );
}
