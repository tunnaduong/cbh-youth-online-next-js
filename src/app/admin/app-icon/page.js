"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Switch,
  Input,
  Button,
  Tag,
  Divider,
  Alert,
  Space,
  message,
} from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { getAppConfig, adminUpdateAppIcon } from "@/app/Api";

const ICON_PRESETS = [
  { value: "default", label: "CBH Youth Mặc định (Ếch xanh CYO)", tag: "Mặc định" },
  { value: "TeachersDay", label: "20/11 Nhà giáo Việt Nam (Sách & Bút vàng)", tag: "Sự kiện 20/11" },
  { value: "Christmas", label: "Giáng sinh (Cây thông & Mũ noel)", tag: "Lễ hội" },
  { value: "NewYear2026", label: "Năm mới 2026 (Đỏ may mắn)", tag: "Tết & Năm mới" },
  { value: "Dark", label: "Dark (Giao diện tối)", tag: "Tối giản" },
  { value: "ClearDark", label: "Clear Dark (Trong suốt tối)", tag: "Trong suốt" },
  { value: "ClearLight", label: "Clear Light (Trong suốt sáng)", tag: "Trong suốt" },
  { value: "TintedDark", label: "Tinted Dark (Sắc thái tối)", tag: "Sắc thái" },
  { value: "TintedLight", label: "Tinted Light (Sắc thái sáng)", tag: "Sắc thái" },
  { value: "Classic", label: "Classic CYO (Logo cổ điển)", tag: "Hoài niệm" },
  { value: "SchoolCrest", label: "Huy hiệu trường Chuyên Biên Hòa", tag: "Trường học" },
];

export default function AdminAppIconPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);

  // Form state
  const [selectedIcon, setSelectedIcon] = useState("default");
  const [isForced, setIsForced] = useState(false);
  const [reason, setReason] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getAppConfig();
      // Unpack response correctly (whether axios wrapped or raw object)
      const data = res?.data || res;
      const appIcon = data?.app_icon;

      if (appIcon) {
        setConfig(appIcon);
        setSelectedIcon(appIcon.admin_override || appIcon.target_icon || "default");
        setIsForced(Boolean(appIcon.force));
        setReason(appIcon.override_reason || appIcon.reason || "");
      }
    } catch (err) {
      console.error("[AppIcon] Fetch config error:", err);
      message.error("Không thể tải cấu hình biểu tượng ứng dụng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateAppIcon({
        icon: selectedIcon,
        force: isForced,
        reason: reason.trim() || undefined,
      });
      message.success("Cập nhật chỉ thị biểu tượng ứng dụng và ghi nhật ký thành công!");
      fetchConfig();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cấu hình biểu tượng";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSeasonal = async () => {
    setSaving(true);
    try {
      await adminUpdateAppIcon({
        icon: null,
        force: false,
        reason: undefined,
      });
      message.success("Đã hủy ghi đè, ứng dụng sẽ tự động chạy theo lịch sự kiện!");
      fetchConfig();
    } catch (err) {
      message.error("Lỗi khi đặt lại lịch tự động");
    } finally {
      setSaving(false);
    }
  };

  const activeIconItem = ICON_PRESETS.find((p) => p.value === config?.target_icon) || {
    label: config?.target_icon || "Mặc định",
    tag: "Hiện tại",
  };

  const seasonalIconItem = ICON_PRESETS.find((p) => p.value === config?.seasonal_icon) || {
    label: config?.seasonal_icon || "Mặc định",
    tag: "Tự động",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AppstoreOutlined className="text-emerald-600" />
            Quản lý Biểu tượng Ứng dụng (Mobile App Icon)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chỉ thị đổi biểu tượng màn hình chính cho ứng dụng Android & iOS qua server.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
          Làm mới
        </Button>
      </div>

      {/* Overview Cards (Custom styled to guarantee correct visual presentation) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-gray-100 dark:border-neutral-700 h-full">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Biểu tượng hiệu lực hiện tại
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-xl text-emerald-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {config?.target_icon || "default"}
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {activeIconItem.label}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {config?.admin_override
                ? `(Đang ghi đè bởi Quản trị viên: ${config.admin_override})`
                : "(Đang chạy theo Lịch sự kiện tự động)"}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-gray-100 dark:border-neutral-700 h-full">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Lịch mùa lễ tự động (Calendar)
            </div>
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-xl text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {config?.seasonal_icon || "default"}
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              {seasonalIconItem.label}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {config?.seasonal_reason || "Mặc định (Không trong tuần lễ hội)"}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-gray-100 dark:border-neutral-700 h-full">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Chế độ Bắt buộc (Force Mode)
            </div>
            <div className="flex items-center gap-2">
              <ExclamationCircleOutlined className={`text-xl ${config?.force ? "text-red-500" : "text-green-500"}`} />
              <span className={`text-2xl font-bold ${config?.force ? "text-red-600" : "text-emerald-600"}`}>
                {config?.force ? "BẬT (Tất cả user)" : "TẮT (Chỉ user mặc định)"}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {config?.force
                ? "Ép đổi icon cho mọi người dùng khi mở app"
                : "Giữ nguyên nếu người dùng đã tự chọn icon riêng"}
            </div>
            {config?.updated_at && (
              <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                <ClockCircleOutlined /> Cập nhật: {new Date(config.updated_at).toLocaleString("vi-VN")}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Control Card */}
      <Card
        title="Thiết lập chỉ thị biểu tượng"
        className="shadow-sm border-gray-100 dark:border-neutral-700"
      >
        <div className="space-y-6">
          <Alert
            type="info"
            showIcon
            message="Quy tắc đồng bộ biểu tượng máy người dùng"
            description={
              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <li>
                  <strong>Bình thường (Force: TẮT)</strong>: Chỉ thị chỉ áp dụng cho người dùng đang để icon mặc định. Những ai đã tự tay chọn icon khác trong Cài đặt sẽ được giữ nguyên.
                </li>
                <li>
                  <strong>Bắt buộc (Force: BẬT)</strong>: Áp dụng chuyển icon cho 100% người dùng khi mở ứng dụng (dùng cho các dịp trọng đại của trường như 20/11, Lễ khai giảng). Kèm thông báo toast & notification hệ thống trên máy người dùng.
                </li>
                <li>
                  <strong>Lịch tự động</strong>:
                  Tuần 20/11 (14/11 - 21/11) sang icon <strong>TeachersDay</strong>;
                  Trước Giáng Sinh (18/12 - 27/12) sang icon <strong>Christmas</strong>;
                  Năm mới (28/12 - 05/01) sang <strong>NewYear2026</strong>.
                </li>
              </ul>
            }
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Chọn biểu tượng mong muốn:
              </label>
              <Select
                value={selectedIcon}
                onChange={setSelectedIcon}
                className="w-full"
                size="large"
                options={ICON_PRESETS.map((p) => ({
                  value: p.value,
                  label: (
                    <div className="flex items-center justify-between">
                      <span>{p.label}</span>
                      <Tag color="cyan">{p.tag}</Tag>
                    </div>
                  ),
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Bắt buộc thay đổi (Force Override)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ép toàn bộ người dùng chuyển sang icon này, kể cả những người đã tùy chỉnh icon khác.
                </div>
              </div>
              <Switch checked={isForced} onChange={setIsForced} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Lý do / Mô tả sự kiện (tùy chọn):
              </label>
              <Input
                placeholder="Ví dụ: Tri ân Thầy Cô ngày 20/11"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={255}
                size="large"
              />
            </div>
          </div>

          <Divider />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              danger
              onClick={handleResetToSeasonal}
              loading={saving}
            >
              Hủy ghi đè (Chạy theo Lịch Tự Động)
            </Button>

            <Space>
              <Button onClick={fetchConfig} disabled={saving}>
                Làm mới lại
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Lưu và Phát hành chỉ thị
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
}
