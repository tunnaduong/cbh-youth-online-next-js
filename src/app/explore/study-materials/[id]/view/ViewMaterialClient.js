"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Typography,
  Spin,
  Empty,
  message,
  Breadcrumb
} from "antd";
import {
  Home,
  Book,
  Search,
  Map,
  Print,
  HelpCircle,
  GameController,
  Trophy,
  People,
  DownloadOutline,
} from "react-ionicons";
import HomeLayout from "@/layouts/HomeLayout";
import { useAuthContext } from "@/contexts/Support";
import { getStudyMaterial } from "@/app/Api";

const { Title, Text } = Typography;

export default function ViewMaterialClient({ materialId }) {
  const { loggedIn, currentUser } = useAuthContext();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterial(materialId);
      const data = response.data;
      setMaterial(data);

      // Check if user has access
      const hasAccess = data.is_free || data.is_purchased;

      if (!hasAccess) {
        setIsUnauthorized(true);
        message.error("Bạn chưa mua tài liệu này");
        setTimeout(() => router.push(`/explore/study-materials/${materialId}`), 3000);
        return;
      }

      // Fetch the actual file for viewing
      await fetchFileContent();

    } catch (err) {
      console.error("Error loading material:", err);
      message.error("Không thể tải thông tin tài liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async () => {
    try {
      const token = localStorage.getItem("TOKEN");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1.0/study-materials/${materialId}/download`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      setFileUrl(objectUrl);
    } catch (err) {
      console.error("Error fetching file content:", err);
      message.error("Không thể tải nội dung tài liệu");
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", material?.file?.file_name || "document");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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

  if (loading) {
    return (
      <HomeLayout activeNav="study" activeBar="study" sidebarItems={sidebarItems} sidebarType="all">
        <div className="flex justify-center items-center min-h-screen">
          <Spin size="large" tip="Đang tải tài liệu..." />
        </div>
      </HomeLayout>
    );
  }

  if (isUnauthorized) {
    return (
      <HomeLayout activeNav="study" activeBar="study" sidebarItems={sidebarItems} sidebarType="all">
        <div className="flex flex-col justify-center items-center min-h-screen px-4">
          <Empty description="Bạn không có quyền xem tài liệu này. Vui lòng mua tài liệu trước." />
          <Button
            type="primary"
            className="mt-4 bg-green-600 border-none rounded-lg"
            onClick={() => router.push(`/explore/study-materials/${materialId}`)}
          >
            Quay lại trang chi tiết
          </Button>
        </div>
      </HomeLayout>
    );
  }

  if (!material) {
    return (
      <HomeLayout activeNav="study" activeBar="study" sidebarItems={sidebarItems} sidebarType="all">
        <div className="flex justify-center items-center min-h-screen">
          <Empty description="Tài liệu không tồn tại" />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout
      activeNav="study"
      activeBar="study"
      showRightSidebar={false}
      sidebarItems={sidebarItems}
      sidebarType="all"
    >
      <div className="min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Breadcrumb
                className="mb-2"
                items={[
                  { title: "Tài liệu ôn thi", href: "/explore/study-materials" },
                  { title: material.title, href: `/explore/study-materials/${materialId}` },
                  { title: "Xem trực tiếp" },
                ]}
              />
              <Title level={3} className="m-0 dark:text-neutral-100">
                {material.title}
              </Title>
            </div>

            <div className="flex gap-3">
              <Button
                icon={<DownloadOutline height="16px" width="16px" color="currentColor" />}
                onClick={handleDownload}
                className="rounded-xl flex items-center justify-center h-[44px] px-6 font-medium border-gray-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                Tải xuống
              </Button>
              <Button
                type="primary"
                onClick={() => router.push(`/explore/study-materials/${materialId}`)}
                className="rounded-xl h-[44px] px-6 font-medium border-none shadow-sm"
              >
                Quay lại
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden min-h-[80vh] flex flex-col relative border border-gray-100 dark:border-neutral-700">
            {fileUrl ? (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full absolute inset-0 border-none"
                title={material.title}
              />
            ) : (
              <div className="flex flex-col justify-center items-center flex-grow p-12 text-center">
                <Spin size="large" className="mb-4" />
                <Text type="secondary">Đang chuẩn bị nội dung tài liệu...</Text>
              </div>
            )}
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-neutral-800 rounded-2xl border border-blue-100 dark:border-neutral-700">
            <Text strong className="text-blue-800 dark:text-blue-300 block mb-2 text-lg">Lưu ý bản quyền:</Text>
            <Text className="text-blue-700 dark:text-blue-400">
              Tài liệu này được cung cấp cho mục đích học tập cá nhân. Vui lòng không sao chép, phát tán hoặc kinh doanh trái phép nội dung này khi chưa có sự đồng ý của tác giả và nền tảng.
            </Text>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
