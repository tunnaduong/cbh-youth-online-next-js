"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Typography,
  Card,
  Button,
  Rate,
  Divider,
  Avatar,
  List,
  Tag,
  Skeleton,
  Breadcrumb,
  Space,
  Descriptions,
  message,
  Empty,
  Row,
  Col,
  Input,
  Modal,
} from "antd";
import {
  Book,
  DownloadOutline,
  EyeOutline,
  Star,
  PersonOutline,
  TimeOutline,
  WalletOutline,
  Home,
  Search,
  Map,
  Print,
  HelpCircle,
  GameController,
  Trophy,
  People,
} from "react-ionicons";
import { useAuthContext, useTopUsersContext } from "@/contexts/Support";
import * as Api from "@/app/Api";
import {
  getStudyMaterial,
  purchaseMaterial,
  downloadMaterial,
  viewMaterial,
  getMaterialRatings,
  rateMaterial,
} from "@/app/Api";

const { Title, Text, Paragraph } = Typography;

export default function StudyMaterialDetailClient({ materialId }) {
  const { loggedIn, currentUser, setCurrentUser, refreshUser } = useAuthContext();
  const { fetchTopUsers } = useTopUsersContext();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRate, setSubmittingRate] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

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

  useEffect(() => {
    loadMaterial();
    loadRatings();
  }, [materialId]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterial(materialId);
      setMaterial(response.data);
      if (response.data.user_rating) {
        setUserRating(response.data.user_rating);
        setRatingValue(response.data.user_rating.rating);
        setRatingComment(response.data.user_rating.comment || "");
      }

      // Track view separately so it doesn't block page load if it fails
      viewMaterial(materialId).catch(err => {
        console.warn("Failed to track view:", err);
      });
    } catch (err) {
      console.error("Error loading study material:", err);
      const errorMsg = err.response?.data?.message || "Không thể tải tài liệu";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const response = await getMaterialRatings(materialId);
      setRatings(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để mua tài liệu");
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }

    // Fetch fresh points from DB before showing purchase modal
    let currentUserData = currentUser;
    try {
      setLoading(true);
      currentUserData = await refreshUser();
      setLoading(false);
    } catch (err) {
      console.error("Failed to refresh user points:", err);
      // Continue with existing points if refresh fails
      setLoading(false);
    }

    const currentPoints = currentUserData?.total_points || 0;
    const price = material.price || 0;
    const remainingPoints = currentPoints - price;

    if (currentPoints < price) {
      Modal.error({
        title: "Không đủ điểm",
        content: `Bạn hiện có ${currentPoints} điểm, còn thiếu ${price - currentPoints} điểm để mua tài liệu này.`,
        okText: "Nạp thêm điểm",
        onOk: () => router.push("/wallet/deposit"),
      });
      return;
    }

    Modal.confirm({
      title: "Xác nhận mua tài liệu",
      content: (
        <div className="py-4">
          <div className="flex justify-between mb-2">
            <Text type="secondary">Số dư hiện tại:</Text>
            <Text strong>{currentPoints} điểm</Text>
          </div>
          <div className="flex justify-between mb-2">
            <Text type="secondary">Giá tài liệu:</Text>
            <Text strong className="text-red-500">-{price} điểm</Text>
          </div>
          <Divider className="my-2" />
          <div className="flex justify-between">
            <Text type="secondary">Số dư sau khi mua:</Text>
            <Text strong className="text-green-600">{remainingPoints} điểm</Text>
          </div>
        </div>
      ),
      okText: "Xác nhận mua",
      cancelText: "Hủy bỏ",
      okButtonProps: { className: "bg-green-600 hover:bg-green-700 border-none" },
      onOk: async () => {
        try {
          setPurchasing(true);
          await purchaseMaterial(materialId);
          message.success("Mua tài liệu thành công!");

          // Refresh material details to show download button
          await loadMaterial();

          // Refresh user profile to update points in navbar
          await refreshUser();

          // Also refresh top users ranking list
          if (fetchTopUsers) {
            fetchTopUsers(true);
          }
        } catch (err) {
          message.error(err.response?.data?.message || "Mua tài liệu thất bại");
        } finally {
          setPurchasing(false);
        }
      },
    });
  };

  const handleDownload = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để tải tài liệu");
      return;
    }

    try {
      const token = localStorage.getItem("TOKEN");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1.0/study-materials/${materialId}/download`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", material?.file?.file_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      message.success("Đang bắt đầu tải xuống...");
      loadMaterial();
    } catch (err) {
      message.error("Không thể tải tài liệu");
    }
  };

  const handleRate = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (ratingValue === 0) {
      message.warning("Vui lòng chọn số sao");
      return;
    }

    try {
      setSubmittingRate(true);
      await rateMaterial(materialId, {
        rating: ratingValue,
        comment: ratingComment,
      });
      message.success("Cảm ơn bạn đã đánh giá!");
      setUserRating({ rating: ratingValue, comment: ratingComment });
      loadRatings();
      loadMaterial();
    } catch (err) {
      message.error("Đánh giá thất bại");
    } finally {
      setSubmittingRate(false);
    }
  };

  if (loading) {
    return (
      <HomeLayout activeNav="study" activeBar="study" sidebarItems={sidebarItems} sidebarType="all" showRightSidebar={false}>
        <div className="max-w-[1000px] mx-auto px-4 py-8">
          <Skeleton active avatar paragraph={{ rows: 10 }} />
        </div>
      </HomeLayout>
    );
  }

  if (!material) {
    return (
      <HomeLayout activeNav="study" activeBar="study" sidebarItems={sidebarItems} sidebarType="all" showRightSidebar={false}>
        <div className="max-w-[1000px] mx-auto px-4 py-24">
          <Empty description="Tài liệu không tồn tại hoặc đã bị gỡ bỏ" />
        </div>
      </HomeLayout>
    );
  }

  const canDownload = material.is_free || material.is_purchased;

  return (
    <HomeLayout
      activeNav="study"
      activeBar="study"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="px-4 py-8 min-h-screen">
        <main className="max-w-[1000px] mx-auto">
          <Breadcrumb
            className="mb-6"
            items={[
              {
                title: "Tài liệu ôn thi",
                href: "/explore/study-materials",
              },
              { title: material.title },
            ]}
          />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card className="rounded-2xl border-none shadow-sm mb-6 overflow-hidden dark:bg-neutral-800">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Title level={2} className="mb-2">
                      {material.title}
                    </Title>
                    <Space split={<Divider type="vertical" />} className="text-gray-500 dark:text-neutral-400 text-sm">
                      <Space>
                        <PersonOutline height="14px" width="14px" color="currentColor" />
                        {material.author.profile_name || material.author.username}
                      </Space>
                      <Space>
                        <TimeOutline height="14px" width="14px" color="currentColor" />
                        {new Date(material.created_at).toLocaleDateString("vi-VN")}
                      </Space>
                      {material.category && (
                        <Tag color="blue" className="rounded-full px-3 m-0">
                          {material.category.name}
                        </Tag>
                      )}
                    </Space>
                  </div>
                  {material.is_free ? (
                    <Tag color="success" className="rounded-full px-4 py-1 text-base font-semibold">
                      Miễn phí
                    </Tag>
                  ) : (
                    <Tag color="orange" className="rounded-full px-4 py-1 text-base font-semibold">
                      {material.price} điểm
                    </Tag>
                  )}
                </div>

                <Paragraph className="text-gray-600 dark:text-neutral-400 text-lg mb-8">
                  {material.description}
                </Paragraph>

                {material.preview_content && (
                  <div className="mb-8 p-6 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                    <Title level={4} className="mb-4">
                      Xem trước nội dung
                    </Title>
                    <div
                      className="prose dark:prose-invert max-w-none line-clamp-[10]"
                      dangerouslySetInnerHTML={{ __html: material.preview_content }}
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  {!material.is_free && !material.is_purchased && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handlePurchase}
                      loading={purchasing}
                      className="bg-green-600 hover:bg-green-700 border-none rounded-xl h-[50px] px-8 font-semibold flex items-center gap-2"
                    >
                      <WalletOutline height="20px" width="20px" color="#fff" />
                      Mua ngay ({material.price} điểm)
                    </Button>
                  )}

                  {(material.is_purchased || material.is_free) && (
                    <>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => router.push(`/explore/study-materials/${materialId}/view`)}
                        className="bg-green-600 hover:bg-green-700 border-none rounded-xl h-[50px] px-8 font-semibold flex items-center gap-2"
                      >
                        <EyeOutline color="#fff" height="20px" width="20px" />
                        {material.is_free ? "Xem tài liệu miễn phí" : "Xem tài liệu đã mua"}
                      </Button>

                      <Button
                        size="large"
                        onClick={handleDownload}
                        className="rounded-xl h-[50px] px-8 font-semibold flex items-center gap-2 border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shadow-sm transition-colors hover:dark:bg-neutral-700 hover:bg-gray-50"
                      >
                        <DownloadOutline color="currentColor" height="20px" width="20px" />
                        Tải về
                      </Button>
                    </>
                  )}
                </div>
              </Card>

              {/* Rating Section */}
              <Card className="rounded-2xl border-none shadow-sm mb-6 dark:bg-neutral-800">
                <Title level={4} className="mb-6">
                  Đánh giá tài liệu
                </Title>
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-2xl">
                    <div className="mb-4">
                      <Text strong className="block mb-2 text-lg">
                        Mức độ hài lòng của bạn:
                      </Text>
                      <Rate
                        allowHalf
                        value={ratingValue}
                        onChange={setRatingValue}
                        style={{ fontSize: 32, color: "#fadb14" }}
                      />
                    </div>
                    <div className="mb-4">
                      <Text strong className="block mb-2">
                        Nhận xét chi tiết:
                      </Text>
                      <Input.TextArea
                        rows={4}
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Chia sẻ cảm nghĩ của bạn về bộ tài liệu này..."
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      type="primary"
                      onClick={handleRate}
                      loading={submittingRate}
                      className="border-none rounded-xl h-[40px] px-6 font-medium"
                    >
                      {userRating ? "Cập nhật đánh giá" : "Gửi đánh giá ngay"}
                    </Button>
                  </div>

                  {ratings.length > 0 ? (
                    <List
                      header={<Text strong className="text-lg">{ratings.length} Nhận xét từ cộng đồng</Text>}
                      itemLayout="horizontal"
                      dataSource={ratings}
                      renderItem={(item) => (
                        <List.Item className="px-0 border-b-gray-100 last:border-b-0 py-6">
                          <List.Item.Meta
                            avatar={<Avatar src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${item.user.username}/avatar`}>{item.user.profile_name?.[0]}</Avatar>}
                            title={
                              <Space className="w-full justify-between">
                                <Text strong>{item.user.profile_name || item.user.username}</Text>
                                <Rate disabled allowHalf value={item.rating} style={{ fontSize: 12 }} />
                              </Space>
                            }
                            description={
                              <div className="mt-2">
                                <Paragraph className="text-gray-600 dark:text-neutral-400 m-0">
                                  {item.comment}
                                </Paragraph>
                                <Text type="secondary" className="text-xs mt-1 block">
                                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Empty description="Chưa có đánh giá nào. Hãy là người đầu tiên!" />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card className="rounded-2xl border-none shadow-sm mb-6 sticky top-24 dark:bg-neutral-800">
                <Descriptions title="Thông tin chi tiết" column={1} layout="horizontal" bordered size="middle">
                  <Descriptions.Item label={<Space className="dark:text-neutral-300"><DownloadOutline height="16px" width="16px" color="currentColor" /><Text type="secondary">Lượt tải</Text></Space>}>
                    <Text strong>{material.download_count}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space className="dark:text-neutral-300"><EyeOutline height="16px" width="16px" color="currentColor" /><Text type="secondary">Lượt xem</Text></Space>}>
                    <Text strong>{material.view_count}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><Star color="#fadb14" height="16px" width="16px" /><Text type="secondary">Đánh giá</Text></Space>}>
                    <Text strong>{material.average_rating || 0}</Text>
                    <Text type="secondary" className="text-xs ml-1">({material.ratings_count})</Text>
                  </Descriptions.Item>
                </Descriptions>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                    <Text type="warning" strong className="block mb-1">
                      Lưu ý bản quyền
                    </Text>
                    <Text type="secondary" className="text-xs">
                      Tài liệu này được chia sẻ bởi cộng đồng. Vui lòng tôn trọng quyền sở hữu trí tuệ của tác giả.
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </main>
      </div>
    </HomeLayout>
  );
}

