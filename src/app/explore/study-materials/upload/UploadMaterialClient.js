"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Checkbox,
  InputNumber,
  Card,
  Typography,
  Space,
  message,
  Breadcrumb, Row, Col
} from "antd";
import {
  Book,
  CloudUploadOutline,
  Home,
  Search,
  Map,
  Print,
  HelpCircle,
  GameController,
  Trophy,
  People,
} from "react-ionicons";
import { useAuthContext } from "@/contexts/Support";
import { createStudyMaterial, uploadFile, getStudyMaterialCategories } from "@/app/Api";
import CustomInput from "@/components/ui/input";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function UploadMaterialClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isFree, setIsFree] = useState(true);

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
    if (!loggedIn) {
      router.push("/login?continue=" + encodeURIComponent(window.location.origin + "/explore/study-materials/upload"));
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

  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);
      const currentUser = JSON.parse(localStorage.getItem("CURRENT_USER"));
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uid", currentUser?.id);

      const response = await uploadFile(formData);
      setFileId(response.data.id);
      onSuccess(response.data);
      message.success("Tải tệp lên thành công!");
    } catch (err) {
      onError(err);
      message.error("Tải tệp lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const onFinish = async (values) => {
    if (!fileId) {
      message.warning("Vui lòng tải tệp tài liệu lên");
      return;
    }

    try {
      setLoading(true);
      await createStudyMaterial({
        ...values,
        file_id: fileId,
        price: values.is_free ? 0 : values.price,
      });
      message.success("Đăng tài liệu thành công!");
      router.push("/explore/study-materials");
    } catch (err) {
      message.error(err.response?.data?.message || "Đăng tài liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) return null;

  return (
    <HomeLayout
      activeNav="study"
      activeBar="study"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="bg-gray-50/50 dark:bg-neutral-950 px-4 py-8">
        <main className="max-w-[800px] mx-auto min-h-screen">
          <Breadcrumb
            className="mb-6"
            items={[
              {
                title: "Tài liệu ôn thi",
                href: "/explore/study-materials",
              },
              { title: "Đăng tài liệu" },
            ]}
          />

          <Card className="rounded-2xl border-none shadow-sm overflow-hidden dark:bg-neutral-800">
            <div className="mb-8">
              <Title level={3} style={{ margin: 0 }}>
                Đăng tài liệu mới
              </Title>
              <Text type="secondary">
                Chia sẻ kiến thức của bạn với cộng đồng học sinh Chuyên Biên Hòa
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                is_free: true,
                price: 0,
                status: "published",
              }}
              size="large"
            >
              <Form.Item
                label={<Text strong>Tiêu đề tài liệu</Text>}
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề tài liệu" }]}
              >
                <CustomInput placeholder="Ví dụ: Tổng hợp công thức Toán 12" />
              </Form.Item>

              <Form.Item label={<Text strong>Mô tả tài liệu</Text>} name="description">
                <TextArea
                  rows={4}
                  placeholder="Giới thiệu sơ lược về nội dung tài liệu..."
                  className="rounded-xl"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label={<Text strong>Danh mục</Text>} name="category_id">
                    <Select placeholder="Chọn môn học" className="w-full" allowClear>
                      {categories.map((cat) => (
                        <Select.Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<Text strong>Tải tệp lên (.pdf, .doc, .docx, .txt)</Text>}
                    required
                  >
                    <Upload
                      customRequest={customUpload}
                      maxCount={1}
                      accept=".pdf,.doc,.docx,.txt"
                      className="w-full"
                    >
                      <Button
                        icon={<CloudUploadOutline height="18px" width="18px" className="mr-2 flex items-center justify-center" />}
                        className="w-full flex items-center justify-center rounded-xl border-dashed"
                        loading={uploading}
                      >
                        {fileId ? "Thay đổi tệp" : "Chọn tệp từ máy tính"}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label={<Text strong>Nội dung xem trước (Tùy chọn)</Text>} name="preview_content">
                <TextArea
                  rows={6}
                  placeholder="Nhập một đoạn nội dung tiêu biểu để người dùng đọc trước..."
                  className="rounded-xl"
                />
              </Form.Item>

              <div className="bg-gray-100/50 dark:bg-neutral-900 p-6 rounded-2xl mb-8">
                <Form.Item name="is_free" valuePropName="checked" className="mb-0">
                  <Checkbox onChange={(e) => setIsFree(e.target.checked)}>
                    <Text strong>Tài liệu miễn phí</Text>
                  </Checkbox>
                </Form.Item>

                {!isFree && (
                  <div className="mt-4">
                    <Text type="secondary" className="block mb-2">
                      Nhập số điểm người dùng cần trả để tải tài liệu này
                    </Text>
                    <Form.Item
                      name="price"
                      rules={[{ required: !isFree, message: "Vui lòng nhập giá cho tài liệu" }]}
                      className="mb-0"
                    >
                      <InputNumber
                        min={1}
                        className="w-full rounded-xl"
                        addonAfter="điểm"
                        placeholder="Ví dụ: 50"
                      />
                    </Form.Item>
                  </div>
                )}
              </div>

              <Space size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 border-none rounded-xl px-12 h-[50px] font-medium"
                >
                  Đăng tài liệu ngay
                </Button>
                <Button
                  onClick={() => router.back()}
                  className="rounded-xl px-8 h-[50px] border-gray-200"
                >
                  Hủy bỏ
                </Button>
              </Space>
            </Form>
          </Card>
        </main>
      </div>
    </HomeLayout>
  );
}

