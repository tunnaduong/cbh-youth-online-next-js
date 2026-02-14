"use client";

import { useState, useEffect } from "react";
import HomeLayout from "@/layouts/HomeLayout";
import ShopCard from "@/components/shop/ShopCard";
import { getShopProducts, getShopCategories } from "@/app/Api";
import { Package, Filter, Search, ShoppingBag, Sparkles } from "lucide-react";
import { Skeleton, Input, Tabs, Empty } from "antd";

export default function ShopClient() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getShopProducts(),
        getShopCategories(),
      ]);
      setProducts(productsRes.data.data || productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category_id === parseInt(activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <HomeLayout activeNav="shop" showRightSidebar={false} showAds={false}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-green-400 p-8 md:p-12 mb-12 shadow-2xl shadow-primary-500/20">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-bold">
                <Sparkles size={16} />
                <span>Premium Collections</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                CBH Gift Shop
              </h1>
              <p className="text-lg text-white/90 font-medium">
                Sở hữu ngay những món quà lưu niệm độc quyền từ Chuyên Biên Hòa.
                Từ móc chìa khóa đến áo thun thiết kế riêng.
              </p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                <button className="bg-white text-primary-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-neutral-50 transition-all active:scale-95">
                  Khám phá ngay
                </button>
                <button className="bg-primary-700/30 backdrop-blur-md border border-white/30 text-white px-8 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all">
                  Tin tức mới
                </button>
              </div>
            </div>
            <div className="hidden lg:block relative w-80 h-80">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
              <ShoppingBag size={320} className="text-white/20 absolute -right-10 -bottom-10 rotate-12" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        {/* Filters and Search */}
        <div className="sticky top-[4.3rem] z-20 bg-[#F8F8F8]/80 dark:bg-neutral-800/80 backdrop-blur-xl py-4 mb-8 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeCategory === "all"
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                    }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id.toString())}
                    className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeCategory === cat.id.toString()
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Input
                prefix={<Search size={18} className="text-neutral-400" />}
                placeholder="Tìm kiếm quà tặng..."
                size="large"
                className="rounded-2xl border-none shadow-sm dark:bg-neutral-900 dark:text-white"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 space-y-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <Skeleton.Image className="w-full h-64 rounded-xl" active />
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ShopCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <Empty
              description={<span className="text-neutral-500 font-medium">Không tìm thấy sản phẩm nào</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}

        {/* Categories Preview (Optional extra section) */}
        {!loading && searchQuery === "" && activeCategory === "all" && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-2 bg-primary-500 rounded-full"></div>
              <h2 className="text-2xl font-black dark:text-white">Tại sao chọn CBH Shop?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">Thiết kế độc quyền</h3>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Tất cả sản phẩm đều được thiết kế riêng bởi các thế hệ học sinh Chuyên Biên Hòa.</p>
              </div>
              <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/30">
                  <Package size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">Chất lượng cao</h3>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Chúng tôi cam kết sử dụng chất liệu tốt nhất cho áo thun và các phụ kiện đi kèm.</p>
              </div>
              <div className="p-8 bg-purple-50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800">
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/30">
                  <Filter size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">Ủng hộ quỹ Đoàn</h3>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Phần lớn lợi nhuận sẽ được đóng góp vào quỹ hoạt động Đoàn và Hội học sinh trường.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
