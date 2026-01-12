"use client";
import { useState, useEffect } from "react";
import {
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Space,
  Form,
  Spin,
  Alert,
  message,
  Tabs,
} from "antd";
import CustomInput from "@/components/ui/input";
import {
  SearchOutline,
  ReloadOutline,
  PersonOutline,
  CalendarAsString,
  CalendarOutline,
  PeopleOutline,
  TrophyOutline,
  Search,
  Calendar,
  People,
  Trophy,
} from "react-ionicons";
import HomeLayout from "@/layouts/HomeLayout";
import axios from "axios";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/themeContext";
import SeoContent from "./SeoContent";

const { Title, Text } = Typography;

export default function GradesClient() {
  const [loading, setLoading] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [resultGrade, setResultGrade] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false); // State to toggle captcha visibility
  const [form] = Form.useForm();
  const router = useRouter();
  const { theme } = useTheme();

  // API Endpoint
  const API_URL = "https://tunnaduong.com/test_api/diemthi_lookup_score.php";

  const refreshCaptcha = () => {
    // Add timestamp to prevent caching
    setCaptchaUrl(`${API_URL}?action=get_captcha&t=${Date.now()}`);
  };

  useEffect(() => {
    refreshCaptcha();
    form.setFieldsValue({
      year: (new Date().getFullYear() - 1).toString(),
      semester: "1",
    });
  }, []);

  const handleFeatureClick = (e, key, href) => {
    if (["schedule", "class-ranking", "member-ranking"].includes(key)) {
      e.preventDefault();
      message.info("Chức năng đang phát triển");
    }
  };

  const sidebarItems = [
    {
      Icon: Search,
      label: "Tra cứu điểm thi",
      key: "grades",
      href: "/lookup/grades",
    },
    {
      Icon: Calendar,
      label: "Tra cứu thời khóa biểu",
      key: "schedule",
      href: "#",
      onClick: (e) => handleFeatureClick(e, "schedule", "#"),
    },
    {
      Icon: People,
      label: "Xếp hạng lớp",
      key: "class-ranking",
      href: "#",
      onClick: (e) => handleFeatureClick(e, "class-ranking", "#"),
    },
    {
      Icon: Trophy,
      label: "Xếp hạng thành viên",
      key: "member-ranking",
      href: "#", // Assuming this might be different or under lookup now? Keeping likely URL structure or # per request
      onClick: (e) => handleFeatureClick(e, "member-ranking", "#"),
    },
  ];

  const handleSearch = async (values, type) => {
    setLoading(true);
    setResultGrade(null);
    setResultInfo(null);

    // If searching info and captcha is hidden/empty, we might need to prompt for it?
    // Requirement: "chỉ yêu cầu nhập mã captcha khi xem thông tin học sinh"
    // So if type is info, check captcha.

    if (type === "info" && !values.captcha) {
      setLoading(false);
      setShowCaptcha(true);
      message.info("Vui lòng nhập mã xác thực để xem thông tin học sinh");
      return;
    }

    const formData = new FormData();
    formData.append("year", values.year);
    // formData.append("ma", values.captcha); // Only append if exists or needed

    if (type === "info") {
      formData.append("semesterid", values.semester);
      formData.append("id", values.student_id.toUpperCase());
      formData.append("ma", values.captcha);
      formData.append("action", "search");
    } else {
      formData.append("sem", values.semester);
      formData.append("studentid", values.student_id.toUpperCase());
      // Grades might not need captcha now based on previous context, but manual_test showed it skipping.
      // Let's assume we don't send 'ma' for grades or send empty.
      formData.append("action", "show_gradess");
    }

    try {
      const response = await axios.post(
        `${API_URL}?action=search_score`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = response.data;

      // Check for errors in response
      if (data.errors && Array.isArray(data.errors)) {
        message.error(data.errors[0]);
        if (data.errors[0].includes("capcha")) {
          refreshCaptcha();
          form.setFieldValue("captcha", "");
        }
        return;
      }

      if (type === "info") {
        // For info, usually data is the user info array
        // If it's a single object, wrap it
        const infoData = Array.isArray(data.data)
          ? data.data
          : data.data
          ? [data.data]
          : [];
        if (infoData.length > 0) {
          setResultInfo(infoData);
        } else {
          message.warning("Không tìm thấy thông tin học sinh!");
        }
      } else {
        // For grades, check if it's array or object
        let grades = null;
        if (Array.isArray(data.data) && data.data[0]?.kqhoctap) {
          grades = data.data[0].kqhoctap;
        } else if (data.data?.kqhoctap) {
          grades = data.data.kqhoctap;
        }

        if (grades) {
          setResultGrade(grades);
        } else {
          message.warning("Không tìm thấy điểm thi!");
        }
      }

      // If we used captcha, refresh it
      if (type === "info") {
        refreshCaptcha();
        form.setFieldValue("captcha", "");
      }
    } catch (error) {
      console.error("Search error:", error);
      message.error("Đã có lỗi xảy ra khi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // Columns for Info Table
  const infoColumns = [
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Ngày sinh",
      dataIndex: "birth_date",
      key: "birth_date",
      render: (text) => (text ? moment(text).format("DD/MM/YYYY") : ""),
    },
    {
      title: "Trường",
      dataIndex: "dept_name",
      key: "dept_name",
    },
    {
      title: "Lớp",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "Giới tính",
      dataIndex: "sex",
      key: "sex",
      render: (text) => (text == -1 ? "Nữ" : "Nam"),
    },
  ];

  // Columns for Grade Table
  const gradeColumns = [
    {
      title: "Môn học",
      dataIndex: "subject_name",
      key: "subject_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Điểm thành phần",
      children: [
        {
          title: "Thường xuyên",
          key: "diem_thuong_xuyen",
          width: 150,
          render: (_, record) => {
            const semester = form.getFieldValue("semester");
            return semester == 3
              ? record.grade_3_1
              : record[`grade_${semester}_1M`];
          },
        },
        {
          title: "Giữa kỳ",
          key: "diem_giua_ky",
          width: 100,
          render: (_, record) => {
            const semester = form.getFieldValue("semester");
            return record[`grade_${semester}_2`];
          },
        },
        {
          title: "Cuối kỳ",
          key: "diem_cuoi_ky",
          width: 100,
          render: (_, record) => {
            const semester = form.getFieldValue("semester");
            return record[`grade_${semester}_3`];
          },
        },
      ],
    },
    {
      title: "Điểm TB",
      key: "diem_tb",
      width: 100,
      fixed: "right",
      render: (_, record) => {
        const semester = form.getFieldValue("semester");
        return (
          <span className="font-bold text-green-600">
            {record[`grade_${semester}_4`]}
          </span>
        );
      },
    },
  ];

  return (
    <HomeLayout
      activeNav="lookup"
      activeBar="grades"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
    >
      <div className="px-4 py-8">
        <main className="max-w-[800px] mx-auto min-h-screen">
          <div className="flex justify-between items-center mb-8">
            <Title level={2} style={{ margin: 0 }}>
              Tra cứu điểm thi
            </Title>
          </div>

          <Card className="rounded-2xl shadow-sm border-none mb-8 dark:bg-neutral-800">
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => handleSearch(values, "grade")}
              size="large"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="student_id"
                    label="Mã học sinh"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã học sinh" },
                    ]}
                  >
                    <CustomInput placeholder="Nhập mã học sinh (VD: HEAD...)" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="year"
                    label="Năm học"
                    rules={[{ required: true, message: "Chọn năm học" }]}
                  >
                    <Select>
                      {Array.from({ length: 10 }, (_, i) => {
                        const currentYear = new Date().getFullYear();
                        // Logic: If currently 2026, user wants 2025-2026 as latest.
                        // Implies we are in 2nd semester of 2025-2026 or summer.
                        // If we strictly follow "latest is 2025-2026" for 2026:
                        // start y from currentYear - 1.
                        const y = currentYear - 1 - i;
                        return (
                          <Select.Option key={y} value={y.toString()}>
                            {y} - {y + 1}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="semester"
                    label="Học kỳ"
                    rules={[{ required: true, message: "Chọn học kỳ" }]}
                  >
                    <Select>
                      <Select.Option value="1">Học kỳ 1</Select.Option>
                      <Select.Option value="2">Học kỳ 2</Select.Option>
                      <Select.Option value="3">Cả năm</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Captcha Section - Only show if specifically needed or toggled */}
              <div className={showCaptcha ? "block" : "hidden"}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Mã xác thực" style={{ marginBottom: 0 }}>
                      <div className="flex gap-2">
                        <Form.Item
                          name="captcha"
                          rules={[
                            {
                              required: showCaptcha,
                              message: "Nhập mã captcha",
                            },
                          ]}
                          noStyle
                        >
                          <CustomInput placeholder="Nhập mã xác thực" />
                        </Form.Item>
                        <div className="flex-shrink-0 relative h-[40px] w-[120px] bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                          {captchaUrl ? (
                            <img
                              src={captchaUrl}
                              alt="Captcha"
                              className="h-full w-full object-contain cursor-pointer"
                              onClick={refreshCaptcha}
                              title="Nhấn để tải lại mã"
                            />
                          ) : (
                            <Spin size="small" />
                          )}
                        </div>
                        <Button
                          icon={<ReloadOutline height="20px" width="20px" />}
                          className="min-w-[40px] max-h-[40px]"
                          onClick={refreshCaptcha}
                          title="Lấy mã mới"
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SearchOutline color="#fff" />}
                  className="flex-1 rounded-xl h-[44px] font-medium"
                  onClick={() => setShowCaptcha(false)} // Hide captcha when just checking grades preferred
                >
                  Tra cứu điểm
                </Button>
                <Button
                  loading={loading}
                  icon={
                    <PersonOutline color={theme === "dark" ? "#fff" : "#000"} />
                  }
                  className="flex-1 rounded-xl h-[44px] font-medium"
                  onClick={() => {
                    setShowCaptcha(true); // Ensure captcha is shown for Info
                    form.validateFields().then((values) => {
                      // Provide a small delay or ensure state sets before validation checking in handleSearch?
                      // Actually handleSearch checks values.captcha.
                      // If field wasn't visible, it might be empty.
                      handleSearch(values, "info");
                    });
                  }}
                >
                  Xem thông tin
                </Button>
              </div>
            </Form>
          </Card>

          {resultGrade && (
            <Card
              title="Kết quả học tập"
              className="rounded-2xl shadow-sm border-none mb-8 dark:bg-neutral-800"
            >
              <Table
                dataSource={resultGrade}
                columns={gradeColumns}
                rowKey="subject_id"
                pagination={false}
                scroll={{ x: 600 }}
                bordered
              />
            </Card>
          )}

          {resultInfo && (
            <Card
              title="Thông tin học sinh"
              className="rounded-2xl shadow-sm border-none mb-8 dark:bg-neutral-800"
            >
              <Table
                dataSource={resultInfo}
                columns={infoColumns}
                rowKey="student_id"
                pagination={false}
                scroll={{ x: true }}
              />
            </Card>
          )}

          <SeoContent />
        </main>
      </div>
    </HomeLayout>
  );
}
