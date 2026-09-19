"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Select, Button, message, Dropdown } from "antd";
import {
  Book,
  Search,
  AddOutline,
  Home,
  Map,
  Print,
  HelpCircle,
  GameController,
  Trophy,
  People,
} from "react-ionicons";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  FileQuestion,
} from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import MaterialCard from "@/components/study-materials/MaterialCard";
import { useAuthContext } from "@/contexts/Support";
import * as Api from "@/app/Api";

/** Khung xương hiển thị trong lúc tải danh sách lần đầu. */
function MaterialCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-neutral-700/80 dark:bg-neutral-800">
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-100 dark:bg-neutral-700/60" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100 dark:bg-neutral-700/60" />
        <div className="h-3.5 w-full animate-pulse rounded bg-gray-100 dark:bg-neutral-700/60" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-gray-100 dark:bg-neutral-700/60" />
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-neutral-700/70">
          <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100 dark:bg-neutral-700/60" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-neutral-700/60" />
        </div>
      </div>
    </div>
  );
}

export default function StudyMaterialsClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [isFree, setIsFree] = useState("all");
  const [sort, setSort] = useState({
    key: "newest",
    label: "Mới nhất",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    has_more_pages: true,
  });

  const sidebarItems = [
    {
      Icon: Home,
      label: "Trang chủ",
      key: "home",
      href: "/explore",
    },
    {
      Icon: Book,
      label: "Chợ tài liệu",
      key: "study",
      href: "/explore/study-materials",
    },
    {
      Icon: Search,
      label: "Tra cứu điểm thi",
      key: "grades",
      href: "/lookup/grades",
    },
    {
      Icon: Map,
      label: "Tìm trường ĐH-CĐ",
      key: "universities",
      href: "#",
    },
    {
      Icon: Print,
      label: "In ấn tài liệu",
      key: "print",
      href: "#",
    },
    {
      Icon: HelpCircle,
      label: "Đố vui",
      key: "quiz",
      href: "/explore/quiz",
    },
    {
      Icon: GameController,
      label: "Game",
      key: "game",
      href: "/explore/games",
    },
    {
      Icon: Trophy,
      label: "Xếp hạng thành viên",
      key: "ranking",
      href: "/users/ranking",
    },
    {
      Icon: People,
      label: "Xếp hạng lớp",
      key: "class-ranking",
      href: "#",
    },
  ];

  const handleUploadClick = (e) => {
    if (!loggedIn) {
      e.preventDefault();
      message.info("Vui lòng đăng nhập để đăng tài liệu");
      router.push(
        "/login?continue=" +
        encodeURIComponent(
          window.location.origin + "/explore/study-materials/upload"
        )
      );
    }
  };

  const loadMaterials = useCallback(
    async (page = 1, reset = false) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
        });
        if (search) params.append("search", search);
        if (categoryId) params.append("category_id", categoryId);

        if (isFree === "free") params.append("is_free", "true");
        if (isFree === "paid") params.append("is_free", "false");
        if (isFree === "purchased") params.append("is_purchased", "true");

        if (sort.sortBy) params.append("sort_by", sort.sortBy);
        if (sort.sortOrder) params.append("sort_order", sort.sortOrder);

        const response = await Api.getStudyMaterials(params.toString());

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
      } finally {
        setLoading(false);
      }
    },
    [search, categoryId, isFree, sort]
  );

  const loadCategories = async () => {
    try {
      const response = await Api.getStudyMaterialCategories();
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadMaterials(1, true);
  }, [loadMaterials]);

  useEffect(() => {
    loadMaterials(1, true);
  }, [loadMaterials, search, categoryId, isFree, sort]);

  const sortOptions = [
    {
      key: "newest",
      label: "Mới nhất",
      sortBy: "created_at",
      sortOrder: "desc",
    },
    { key: "oldest", label: "Cũ nhất", sortBy: "created_at", sortOrder: "asc" },
    {
      key: "alphabetical",
      label: "A - Z (Tiêu đề)",
      sortBy: "title",
      sortOrder: "asc",
    },
    {
      key: "rating",
      label: "Xếp hạng cao nhất",
      sortBy: "average_rating",
      sortOrder: "desc",
    },
    {
      key: "downloads",
      label: "Lượt tải nhiều nhất",
      sortBy: "download_count",
      sortOrder: "desc",
    },
    {
      key: "views",
      label: "Lượt xem nhiều nhất",
      sortBy: "view_count",
      sortOrder: "desc",
    },
    {
      key: "price_high",
      label: "Giá cao nhất",
      sortBy: "price",
      sortOrder: "desc",
    },
    {
      key: "price_low",
      label: "Giá thấp nhất",
      sortBy: "price",
      sortOrder: "asc",
    },
  ];

  return (
    <HomeLayout
      activeNav="study"
      activeBar="study"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="px-4 py-6 overflow-x-hidden">
        <main className="max-w-[1000px] mx-auto min-h-screen">

          {/* Hero banner với search tích hợp */}
          <section className="mb-6">
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-primary-700 via-primary-600 to-green-500 text-white shadow-xl shadow-primary-700/20">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    Diễn đàn học sinh · CBH Youth Online
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                    Chợ tài liệu
                  </h2>
                  <p className="text-sm text-white/75 max-w-sm">
                    Lọc theo danh mục, tải ngay tài liệu hữu ích cho kỳ thi sắp tới.
                  </p>
                </div>
                <Link
                  href="/explore/study-materials/upload"
                  onClick={handleUploadClick}
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Button
                    type="default"
                    icon={<AddOutline color="currentColor" height="15px" width="15px" />}
                    className="h-9 w-full rounded-xl border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25 hover:border-white/60 flex items-center justify-center gap-1.5 font-medium text-sm shadow-none sm:w-auto"
                  >
                    Đăng tài liệu
                  </Button>
                </Link>
              </div>

              {/* Search + category trong hero */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-2">
                <Input
                  size="large"
                  placeholder="Tìm kiếm tài liệu..."
                  prefix={<SearchIcon size={16} className="text-gray-400" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  className="rounded-xl"
                />
                <Select
                  size="large"
                  placeholder="Tất cả môn học"
                  className="w-full"
                  value={categoryId}
                  onChange={(value) => setCategoryId(value)}
                  allowClear
                >
                  <Select.Option value={null}>Tất cả môn học</Select.Option>
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {["Ôn thi THPT", "Đánh giá năng lực", "IELTS", "Miễn phí"].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      if (topic === "Miễn phí") {
                        setIsFree("free");
                      } else {
                        setSearch(topic);
                      }
                    }}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur hover:bg-white/25 transition"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Filter bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Tất cả", value: "all" },
                { label: "Miễn phí", value: "free" },
                { label: "Trả phí", value: "paid" },
                { label: "Đã mua", value: "purchased" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value === "purchased" && !loggedIn) {
                      message.info("Vui lòng đăng nhập để xem tài liệu đã mua");
                      router.push(
                        "/login?continue=" +
                          encodeURIComponent(window.location.href)
                      );
                      return;
                    }
                    setIsFree(opt.value);
                  }}
                  className={`h-9 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                    isFree === opt.value
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Dropdown
              menu={{
                items: sortOptions.map((opt) => ({
                  key: opt.key,
                  label: opt.label,
                  onClick: () => setSort(opt),
                })),
                selectable: true,
                selectedKeys: [sort.key],
              }}
              trigger={["click"]}
            >
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <SlidersHorizontal size={14} strokeWidth={2} />
                <span>{sort.label}</span>
              </button>
            </Dropdown>
          </div>

          {/* Materials grid */}
          {loading && materials.length === 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <MaterialCardSkeleton key={i} />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center text-gray-400 dark:text-neutral-500">
              <FileQuestion size={48} strokeWidth={1.25} className="text-gray-300 dark:text-neutral-600" />
              <p className="text-base font-medium text-gray-500 dark:text-neutral-400">Không tìm thấy tài liệu nào</p>
              <p className="text-sm">Thử thay đổi từ khoá hoặc bộ lọc.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>

              {pagination.has_more_pages && (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => loadMaterials(pagination.current_page + 1, false)}
                    disabled={loading}
                    className="h-11 rounded-full border border-primary-600 px-10 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    {loading ? "Đang tải…" : "Tải thêm tài liệu"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* SEO Section */}
        <section className="max-w-[1000px] mx-auto mt-20 mb-12 bg-white dark:bg-neutral-800 p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-700">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-6">
              Kho Tài Liệu Ôn Thi Toàn Diện: Nâng Bước Thành Công Cho Học Sinh
              &amp; Sinh Viên
            </h1>

            <p className="text-gray-600 dark:text-neutral-300 leading-relaxed mb-6">
              Trong hành trình chinh phục những nấc thang tri thức, việc sở hữu
              một kho <strong>tài liệu ôn thi</strong> chất lượng là yếu tố then
              chốt quyết định đến kết quả học tập của mỗi học sinh, sinh viên.
              Tại <strong>CBH Youth Online</strong>, chúng tôi hiểu rõ nỗi trăn
              trở của các bạn trong việc tìm kiếm nguồn tri thức tin cậy, cập
              nhật và dễ tiếp cận. Chính vì vậy, chuyên mục tài liệu của chúng
              tôi được xây dựng với mục tiêu trở thành nền tảng chia sẻ học liệu
              lớn nhất dành cho tài năng trẻ, nơi hội tụ hàng ngàn bộ đề thi,
              giáo án và chuyên đề bám sát chương trình của Bộ Giáo dục và Đào
              tạo.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Tại sao bạn nên chọn tài liệu ôn thi tại CBH Youth Online?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              <div className="p-6 bg-blue-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">
                  Chất lượng kiểm duyệt kỹ lưỡng
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Mỗi tài liệu đăng tải lên hệ thống đều được cộng đồng và đội
                  ngũ biên tập đánh giá. Chúng tôi ưu tiên các bộ đề thi từ các
                  trường chuyên danh tiếng, các trung tâm luyện thi uy tín và
                  giáo án của các giáo viên giỏi trên toàn quốc.
                </p>
              </div>
              <div className="p-6 bg-green-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">
                  Cập nhật xu hướng thi mới nhất
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Thế giới giáo dục luôn biến động với các phương thức thi như
                  Đánh giá năng lực (VNU, HUST), Đánh giá tư duy hay các chứng
                  chỉ quốc tế IELTS, SAT. Kho tài liệu của chúng tôi luôn đi đầu
                  trong việc cập nhật các dạng đề mới nhất.
                </p>
              </div>
              <div className="p-6 bg-orange-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-2">
                  Cơ chế chia sẻ điểm số công bằng
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Chúng tôi vận hành hệ thống dựa trên tinh thần &quot;Cho đi là
                  nhận lại&quot;. Bạn có thể nhận tài liệu miễn phí hoặc sử dụng
                  điểm tích lũy từ các hoạt động trên diễn đàn để đổi lấy những
                  tài liệu chuyên sâu.
                </p>
              </div>
              <div className="p-6 bg-purple-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-2">
                  Giao diện tối ưu trải nghiệm
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Với bộ lọc thông minh theo khối lớp (Lớp 10, 11, 12), môn học
                  (Toán, Lý, Hóa, Anh, Văn...) và loại hình (Đề thi thử, Chuyên
                  đề, Sách tham khảo), việc tìm kiếm kiến thức chưa bao giờ dễ
                  dàng hơn thế.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Danh mục tài liệu trọng tâm cho các kỳ thi quan trọng
            </h2>
            <p className="mb-4">
              Chúng tôi phân loại tài liệu một cách khoa học để các sĩ tử dễ
              dàng định vị mục tiêu:
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-8">
              <li>
                <strong>Tài liệu ôn thi THPT Quốc gia:</strong> Tổng hợp đề thi
                thử từ 63 tỉnh thành, các bộ đề dự đoán bám sát cấu trúc đề minh
                họa của Bộ GD&ĐT. Giúp học sinh làm quen với áp lực phòng thi và
                quản lý thời gian hiệu quả.
              </li>
              <li>
                <strong>Ôn thi Đánh giá năng lực &amp; Đánh giá tư duy:</strong>{" "}
                Tập trung vào các dạng bài logic, phân tích dữ liệu và tư duy
                phản biện - những phần &quot;khó nhằn&quot; trong kỳ thi của
                ĐHQG Hà Nội, ĐHQG TP.HCM và Bách Khoa.
              </li>
              <li>
                <strong>Hệ thống đề kiểm tra học kỳ:</strong> Đầy đủ các bộ đề
                giữa kỳ, cuối kỳ dành cho học sinh THCS và THPT. Đây là nguồn
                khảo cứu tuyệt vời để củng cố điểm số trên lớp.
              </li>
              <li>
                <strong>Chuyên đề bồi dưỡng học sinh giỏi:</strong> Dành cho
                những bạn đam mê chinh phục các giải thưởng cấp tỉnh, cấp quốc
                gia với hệ thống bài tập nâng cao và lời giải chi tiết.
              </li>
              <li>
                <strong>Tài liệu ngoại ngữ chuyên sâu:</strong> Không chỉ dừng
                lại ở chương trình giáo khoa, chúng tôi cung cấp nguồn học liệu
                IELTS (Reading, Writing task 2), TOEIC và các chứng chỉ tiếng
                Trung, tiếng Nhật.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Chiến thuật sử dụng tài liệu để đạt điểm 9, 10
            </h2>
            <p className="mb-6 leading-relaxed">
              Việc sở hữu hàng ngàn file PDF sẽ không có ý nghĩa nếu bạn không
              có phương pháp học tập đúng đắn. Các chuyên gia đào tạo tại CBH
              Youth Online khuyên các bạn học sinh nên áp dụng mô hình{" "}
              <strong>&quot;Học - Luyện - Chấm - Sửa&quot;</strong>:
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">
                  01
                </div>
                <div>
                  <h4 className="font-bold">Hệ thống hóa kiến thức nền tảng</h4>
                  <p className="text-sm text-gray-500">
                    Hãy bắt đầu bằng cách tải các file &quot;Sơ đồ tư duy&quot;
                    hoặc &quot;Tóm tắt công thức&quot; để nắm được bức tranh
                    tổng quan trước khi dấn thân vào các bài tập khó.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">
                  02
                </div>
                <div>
                  <h4 className="font-bold">
                    Luyện đề trong điều kiện thực tế
                  </h4>
                  <p className="text-sm text-gray-500">
                    Chọn một bộ đề thi thử trên hệ thống, đặt đồng hồ bấm giờ
                    đúng với thời gian thi thật. Đừng vội xem lời giải trước khi
                    thời gian kết thúc.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">
                  03
                </div>
                <div>
                  <h4 className="font-bold">Đối chiếu và phân tích lỗi sai</h4>
                  <p className="text-sm text-gray-500">
                    Đây là bước quan trọng nhất. Hãy tìm kiếm các tài liệu có
                    &quot;Lời giải chi tiết&quot; thay vì chỉ có đáp án trắc
                    nghiệm. Việc hiểu tại sao mình sai giúp bạn tránh lặp lại
                    lỗi đó trong tương lai.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Cộng đồng chia sẻ tri thức - Kiếm thêm thu nhập từ tài liệu sạch
            </h2>
            <p className="mb-6 leading-relaxed">
              Bạn đang sở hữu những bản giáo án tâm huyết? Bạn vừa hoàn thành bộ
              đề thi khảo sát chất lượng của trường mình? Đừng giữ chúng trong ổ
              cứng! Hãy nhấn nút <strong>&quot;Đăng tài liệu&quot;</strong> để
              chia sẻ với hàng ngàn thành viên khác. Khi chia sẻ tài liệu, bạn
              sẽ nhận được điểm thưởng (point). Số điểm này không chỉ dùng để
              tải các tài liệu VIP khác mà còn giúp nâng cao uy tín của bạn
              trong cộng đồng, mở ra cơ hội trở thành các &quot;Cộng tác viên
              học thuật&quot; của CBH Youth Online.
            </p>

            <div className="bg-gray-50 dark:bg-neutral-900 border-l-4 border-blue-500 p-6 my-10 rounded-r-xl">
              <h4 className="text-lg font-bold mb-2">Tầm nhìn sứ mệnh</h4>
              <p className="text-gray-600 dark:text-neutral-400 italic">
                &quot;Chúng tôi tin rằng kiến thức chỉ có giá trị thực sự khi
                được chia sẻ rộng rãi. CBH Youth Online phấn đấu xóa bỏ rào cản
                về khoảng cách địa lý và kinh tế, mang đến nguồn tài liệu ôn thi
                chất lượng nhất cho học sinh từ vùng sâu vùng xa đến thành thị,
                giúp mọi tài năng trẻ đều có cơ hội tỏa sáng.&quot;
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Kết luận
            </h2>
            <p className="mb-12 text-gray-600 dark:text-neutral-300">
              Học tập là một hành trình dài và vất vả, nhưng bạn không đơn độc.
              Với kho <strong>tài liệu ôn thi</strong> khổng lồ và cộng đồng hỗ
              trợ nhiệt tình tại <strong>CBH Youth Online</strong>, chúng tôi tự
              tin đồng hành cùng bạn trên mọi nẻo đường đi tới ước mơ. Hãy bắt
              đầu hành trình chinh phục điểm 10 ngay hôm nay bằng cách khám phá
              các chuyên đề yêu thích của bạn!
            </p>
          </div>
        </section>
      </div>
    </HomeLayout>
  );
}
