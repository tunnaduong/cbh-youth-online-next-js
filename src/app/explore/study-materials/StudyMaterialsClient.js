"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  Segmented,
  Spin,
  Empty,
  Avatar,
  Tooltip,
  message,
  Dropdown,
} from "antd";
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
  DownloadOutline,
  EyeOutline,
  Star,
  FilterOutline,
} from "react-ionicons";
import HomeLayout from "@/layouts/HomeLayout";
import { useAuthContext } from "@/contexts/Support";
import * as Api from "@/app/Api";
import CustomColorButton from "@/components/ui/CustomColorButton";

const { Title, Text, Paragraph } = Typography;

export default function StudyMaterialsClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [isFree, setIsFree] = useState("all");
  const [sort, setSort] = useState({ key: "newest", label: "Mới nhất", sortBy: "created_at", sortOrder: "desc" });
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
      label: "Tài liệu ôn thi",
      key: "study",
      href: "/explore/study-materials",
    },
    {
      Icon: Search,
      label: "Tra cứu điểm thi",
      key: "grades",
      href: "#",
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
      href: "#",
    },
    {
      Icon: GameController,
      label: "Game",
      key: "game",
      href: "#",
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
      router.push("/login?continue=" + encodeURIComponent(window.location.origin + "/explore/study-materials/upload"));
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
    { key: "newest", label: "Mới nhất", sortBy: "created_at", sortOrder: "desc" },
    { key: "oldest", label: "Cũ nhất", sortBy: "created_at", sortOrder: "asc" },
    { key: "alphabetical", label: "A - Z (Tiêu đề)", sortBy: "title", sortOrder: "asc" },
    { key: "rating", label: "Xếp hạng cao nhất", sortBy: "average_rating", sortOrder: "desc" },
    { key: "downloads", label: "Lượt tải nhiều nhất", sortBy: "download_count", sortOrder: "desc" },
    { key: "views", label: "Lượt xem nhiều nhất", sortBy: "view_count", sortOrder: "desc" },
    { key: "price_high", label: "Giá cao nhất", sortBy: "price", sortOrder: "desc" },
    { key: "price_low", label: "Giá thấp nhất", sortBy: "price", sortOrder: "asc" },
  ];

  return (
    <HomeLayout
      activeNav="study"
      activeBar="study"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="px-4 py-8">
        <main className="max-w-[1000px] mx-auto min-h-screen">
          <div className="flex justify-between items-center mb-8">
            <Title level={2} style={{ margin: 0 }}>
              Tài liệu ôn thi
            </Title>
            <Link href="/explore/study-materials/upload" onClick={handleUploadClick}>
              <Button
                type="primary"
                icon={<AddOutline color="#fff" height="20px" width="20px" />}
                className="border-none rounded-lg flex items-center"
              >
                Đăng tài liệu
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm mb-8 space-y-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={18}>
                <Input
                  size="large"
                  placeholder="Tìm kiếm tài liệu..."
                  prefix={<Search color="#9ca3af" height="20px" width="20px" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  size="large"
                  placeholder="Chọn danh mục"
                  className="w-full rounded-xl"
                  value={categoryId}
                  onChange={(value) => setCategoryId(value)}
                  allowClear
                >
                  <Select.Option value={null}>Tất cả danh mục</Select.Option>
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Text strong className="text-gray-500 dark:text-neutral-400">
                  Lọc theo:
                </Text>
                <div className="flex gap-3">
                  {[
                    { label: "Tất cả", value: "all" },
                    { label: "Miễn phí", value: "free" },
                    { label: "Trả phí", value: "paid" },
                    { label: "Đã mua", value: "purchased" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      size="large"
                      onClick={() => {
                        if (opt.value === "purchased" && !loggedIn) {
                          message.info("Vui lòng đăng nhập để xem tài liệu đã mua");
                          router.push("/login?continue=" + encodeURIComponent(window.location.href));
                          return;
                        }
                        setIsFree(opt.value);
                      }}
                      type={isFree === opt.value ? "primary" : "default"}
                      className={`rounded-xl px-6 h-[44px] font-medium transition-all duration-200 ${isFree === opt.value
                        ? "border-none shadow-sm"
                        : "bg-gray-100 dark:bg-neutral-800 border-none hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400"
                        }`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  <Button
                    size="large"
                    className="rounded-xl px-5 h-[44px] font-medium flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 border-none hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 shadow-sm"
                  >
                    <FilterOutline
                      color="currentColor"
                      height="18px"
                      width="18px"
                    />
                    <span>{sort.label}</span>
                  </Button>
                </Dropdown>
              </div>
            </div>
          </div>

          {/* Materials List */}
          {loading && materials.length === 0 ? (
            <div className="flex justify-center py-24">
              <Spin size="large" />
            </div>
          ) : materials.length === 0 ? (
            <Empty
              description="Không tìm thấy tài liệu nào"
              className="py-24"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {materials.map((material) => (
                  <Col xs={24} sm={12} lg={8} key={material.id}>
                    <Link href={`/explore/study-materials/${material.id}`}>
                      <Card
                        hoverable
                        className="h-full rounded-2xl border-none shadow-sm hover:shadow-xl transition-all duration-300 dark:bg-neutral-800"
                        styles={{
                          body: {
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Title level={5} className="m-0 line-clamp-2 pr-2">
                            {material.title}
                          </Title>
                          {material.is_free ? (
                            <Tag color="success" className="rounded-full px-3">
                              Miễn phí
                            </Tag>
                          ) : (
                            <Tag color="orange" className="rounded-full px-3">
                              {material.price} điểm
                            </Tag>
                          )}
                        </div>

                        <Paragraph
                          type="secondary"
                          className="flex-grow line-clamp-3 mb-6"
                        >
                          {material.description}
                        </Paragraph>

                        <div className="flex items-center justify-between mt-auto">
                          <Space size="small">
                            <Avatar size="small" src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${material.author.username}/avatar`}>
                              {material.author.profile_name?.[0] ||
                                material.author.username?.[0]}
                            </Avatar>
                            <Text size="small" className="text-xs">
                              {material.author.profile_name ||
                                material.author.username}
                            </Text>
                          </Space>
                          <Space size="middle" className="text-gray-400 text-[13px]">
                            <Tooltip title="Lượt tải">
                              <Space size={4}>
                                <DownloadOutline color="#9ca3af" height="14px" width="14px" />
                                <span>{material.download_count}</span>
                              </Space>
                            </Tooltip>
                            <Tooltip title="Lượt xem">
                              <Space size={4}>
                                <EyeOutline color="#9ca3af" height="14px" width="14px" />
                                <span>{material.view_count}</span>
                              </Space>
                            </Tooltip>
                            {material.average_rating > 0 && (
                              <Tooltip title="Đánh giá">
                                <Space size={4}>
                                  <Star color="#fadb14" height="14px" width="14px" />
                                  <span>{material.average_rating}</span>
                                </Space>
                              </Tooltip>
                            )}
                          </Space>
                        </div>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>

              {pagination.has_more_pages && (
                <div className="flex justify-center mt-12">
                  <Button
                    type="default"
                    size="large"
                    onClick={() =>
                      loadMaterials(pagination.current_page + 1, false)
                    }
                    loading={loading}
                    className="rounded-xl px-12 h-[50px] font-medium border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Tải thêm tài liệu
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        {/* SEO Section */}
        <section className="max-w-[1000px] mx-auto mt-20 mb-12 bg-white dark:bg-neutral-800 p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-700">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-6">
              Kho Tài Liệu Ôn Thi Toàn Diện: Nâng Bước Thành Công Cho Học Sinh &amp; Sinh Viên
            </h1>

            <p className="text-gray-600 dark:text-neutral-300 leading-relaxed mb-6">
              Trong hành trình chinh phục những nấc thang tri thức, việc sở hữu một kho <strong>tài liệu ôn thi</strong> chất lượng là yếu tố then chốt quyết định đến kết quả học tập của mỗi học sinh, sinh viên. Tại <strong>CBH Youth Online</strong>, chúng tôi hiểu rõ nỗi trăn trở của các bạn trong việc tìm kiếm nguồn tri thức tin cậy, cập nhật và dễ tiếp cận. Chính vì vậy, chuyên mục tài liệu của chúng tôi được xây dựng với mục tiêu trở thành nền tảng chia sẻ học liệu lớn nhất dành cho tài năng trẻ, nơi hội tụ hàng ngàn bộ đề thi, giáo án và chuyên đề bám sát chương trình của Bộ Giáo dục và Đào tạo.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Tại sao bạn nên chọn tài liệu ôn thi tại CBH Youth Online?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              <div className="p-6 bg-blue-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">Chất lượng kiểm duyệt kỹ lưỡng</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Mỗi tài liệu đăng tải lên hệ thống đều được cộng đồng và đội ngũ biên tập đánh giá. Chúng tôi ưu tiên các bộ đề thi từ các trường chuyên danh tiếng, các trung tâm luyện thi uy tín và giáo án của các giáo viên giỏi trên toàn quốc.
                </p>
              </div>
              <div className="p-6 bg-green-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">Cập nhật xu hướng thi mới nhất</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Thế giới giáo dục luôn biến động với các phương thức thi như Đánh giá năng lực (VNU, HUST), Đánh giá tư duy hay các chứng chỉ quốc tế IELTS, SAT. Kho tài liệu của chúng tôi luôn đi đầu trong việc cập nhật các dạng đề mới nhất.
                </p>
              </div>
              <div className="p-6 bg-orange-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-2">Cơ chế chia sẻ điểm số công bằng</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Chúng tôi vận hành hệ thống dựa trên tinh thần &quot;Cho đi là nhận lại&quot;. Bạn có thể nhận tài liệu miễn phí hoặc sử dụng điểm tích lũy từ các hoạt động trên diễn đàn để đổi lấy những tài liệu chuyên sâu.
                </p>
              </div>
              <div className="p-6 bg-purple-50 dark:bg-neutral-900 rounded-2xl">
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-2">Giao diện tối ưu trải nghiệm</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Với bộ lọc thông minh theo khối lớp (Lớp 10, 11, 12), môn học (Toán, Lý, Hóa, Anh, Văn...) và loại hình (Đề thi thử, Chuyên đề, Sách tham khảo), việc tìm kiếm kiến thức chưa bao giờ dễ dàng hơn thế.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Danh mục tài liệu trọng tâm cho các kỳ thi quan trọng
            </h2>
            <p className="mb-4">Chúng tôi phân loại tài liệu một cách khoa học để các sĩ tử dễ dàng định vị mục tiêu:</p>
            <ul className="list-disc pl-6 space-y-3 mb-8">
              <li><strong>Tài liệu ôn thi THPT Quốc gia:</strong> Tổng hợp đề thi thử từ 63 tỉnh thành, các bộ đề dự đoán bám sát cấu trúc đề minh họa của Bộ GD&ĐT. Giúp học sinh làm quen với áp lực phòng thi và quản lý thời gian hiệu quả.</li>
              <li><strong>Ôn thi Đánh giá năng lực &amp; Đánh giá tư duy:</strong> Tập trung vào các dạng bài logic, phân tích dữ liệu và tư duy phản biện - những phần &quot;khó nhằn&quot; trong kỳ thi của ĐHQG Hà Nội, ĐHQG TP.HCM và Bách Khoa.</li>
              <li><strong>Hệ thống đề kiểm tra học kỳ:</strong> Đầy đủ các bộ đề giữa kỳ, cuối kỳ dành cho học sinh THCS và THPT. Đây là nguồn khảo cứu tuyệt vời để củng cố điểm số trên lớp.</li>
              <li><strong>Chuyên đề bồi dưỡng học sinh giỏi:</strong> Dành cho những bạn đam mê chinh phục các giải thưởng cấp tỉnh, cấp quốc gia với hệ thống bài tập nâng cao và lời giải chi tiết.</li>
              <li><strong>Tài liệu ngoại ngữ chuyên sâu:</strong> Không chỉ dừng lại ở chương trình giáo khoa, chúng tôi cung cấp nguồn học liệu IELTS (Reading, Writing task 2), TOEIC và các chứng chỉ tiếng Trung, tiếng Nhật.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Chiến thuật sử dụng tài liệu để đạt điểm 9, 10
            </h2>
            <p className="mb-6 leading-relaxed">
              Việc sở hữu hàng ngàn file PDF sẽ không có ý nghĩa nếu bạn không có phương pháp học tập đúng đắn. Các chuyên gia đào tạo tại CBH Youth Online khuyên các bạn học sinh nên áp dụng mô hình <strong>&quot;Học - Luyện - Chấm - Sửa&quot;</strong>:
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">01</div>
                <div>
                  <h4 className="font-bold">Hệ thống hóa kiến thức nền tảng</h4>
                  <p className="text-sm text-gray-500">Hãy bắt đầu bằng cách tải các file &quot;Sơ đồ tư duy&quot; hoặc &quot;Tóm tắt công thức&quot; để nắm được bức tranh tổng quan trước khi dấn thân vào các bài tập khó.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">02</div>
                <div>
                  <h4 className="font-bold">Luyện đề trong điều kiện thực tế</h4>
                  <p className="text-sm text-gray-500">Chọn một bộ đề thi thử trên hệ thống, đặt đồng hồ bấm giờ đúng với thời gian thi thật. Đừng vội xem lời giải trước khi thời gian kết thúc.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-bold text-blue-600">03</div>
                <div>
                  <h4 className="font-bold">Đối chiếu và phân tích lỗi sai</h4>
                  <p className="text-sm text-gray-500">Đây là bước quan trọng nhất. Hãy tìm kiếm các tài liệu có &quot;Lời giải chi tiết&quot; thay vì chỉ có đáp án trắc nghiệm. Việc hiểu tại sao mình sai giúp bạn tránh lặp lại lỗi đó trong tương lai.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Cộng đồng chia sẻ tri thức - Kiếm thêm thu nhập từ tài liệu sạch
            </h2>
            <p className="mb-6 leading-relaxed">
              Bạn đang sở hữu những bản giáo án tâm huyết? Bạn vừa hoàn thành bộ đề thi khảo sát chất lượng của trường mình? Đừng giữ chúng trong ổ cứng! Hãy nhấn nút <strong>&quot;Đăng tài liệu&quot;</strong> để chia sẻ với hàng ngàn thành viên khác. Khi chia sẻ tài liệu, bạn sẽ nhận được điểm thưởng (point). Số điểm này không chỉ dùng để tải các tài liệu VIP khác mà còn giúp nâng cao uy tín của bạn trong cộng đồng, mở ra cơ hội trở thành các &quot;Cộng tác viên học thuật&quot; của CBH Youth Online.
            </p>

            <div className="bg-gray-50 dark:bg-neutral-900 border-l-4 border-blue-500 p-6 my-10 rounded-r-xl">
              <h4 className="text-lg font-bold mb-2">Tầm nhìn sứ mệnh</h4>
              <p className="text-gray-600 dark:text-neutral-400 italic">
                &quot;Chúng tôi tin rằng kiến thức chỉ có giá trị thực sự khi được chia sẻ rộng rãi. CBH Youth Online phấn đấu xóa bỏ rào cản về khoảng cách địa lý và kinh tế, mang đến nguồn tài liệu ôn thi chất lượng nhất cho học sinh từ vùng sâu vùng xa đến thành thị, giúp mọi tài năng trẻ đều có cơ hội tỏa sáng.&quot;
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 dark:text-neutral-100">
              Kết luận
            </h2>
            <p className="mb-12 text-gray-600 dark:text-neutral-300">
              Học tập là một hành trình dài và vất vả, nhưng bạn không đơn độc. Với kho <strong>tài liệu ôn thi</strong> khổng lồ và cộng đồng hỗ trợ nhiệt tình tại <strong>CBH Youth Online</strong>, chúng tôi tự tin đồng hành cùng bạn trên mọi nẻo đường đi tới ước mơ. Hãy bắt đầu hành trình chinh phục điểm 10 ngay hôm nay bằng cách khám phá các chuyên đề yêu thích của bạn!
            </p>
          </div>
        </section>
      </div>
    </HomeLayout>
  );
}
