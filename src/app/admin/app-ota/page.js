"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Switch,
  Input,
  InputNumber,
  Button,
  Tag,
  Divider,
  Alert,
  Space,
  message,
  Popconfirm,
} from "antd";
import {
  CloudSyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { getAppConfig, adminUpdateAppOta } from "@/app/Api";

export default function AdminAppOtaPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);

  // Form state
  const [isForced, setIsForced] = useState(false);
  const [minBuild, setMinBuild] = useState(null);
  const [targetChannel, setTargetChannel] = useState(null);
  const [reasonMessage, setReasonMessage] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getAppConfig();
      const data = res?.data || res;
      const otaUpdate = data?.ota_update;

      if (otaUpdate) {
        setConfig(otaUpdate);
        setIsForced(Boolean(otaUpdate.force));
        setMinBuild(otaUpdate.min_build ?? null);
        setTargetChannel(otaUpdate.channel ?? null);
        setReasonMessage(otaUpdate.message ?? "");
      }
    } catch (err) {
      console.error("[AppOTA] Fetch config error:", err);
      message.error("Không thể tải cấu hình cập nhật OTA");
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
      await adminUpdateAppOta({
        force: isForced,
        min_build: minBuild ? parseInt(minBuild, 10) : null,
        channel: targetChannel || null,
        message: reasonMessage.trim() || undefined,
      });
      message.success("Cập nhật chỉ thị nâng cấp OTA bắt buộc và ghi nhật ký thành công!");
      fetchConfig();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cấu hình nâng cấp OTA";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToNormal = async () => {
    setSaving(true);
    try {
      await adminUpdateAppOta({
        force: false,
        min_build: null,
        channel: null,
        message: "Hủy bỏ chỉ thị bắt buộc cập nhật",
      });
      message.success("Đã tắt chế độ bắt buộc nâng cấp. Thiết bị sẽ tuân theo cài đặt cá nhân của người dùng.");
      fetchConfig();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi hủy chế độ bắt buộc";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>
            Quản trị Nâng cấp Ứng dụng Bắt buộc (Force OTA)
          </h1>
          <p style={{ color: "#666", margin: "4px 0 0 0" }}>
            Cấu hình chỉ thị cập nhật Over-The-Air bắt buộc từ xa đối với ứng dụng di động (bỏ qua mọi cài đặt tắt cập nhật của người dùng).
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
          Làm mới
        </Button>
      </div>

      {/* Overview Status Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>Chế độ bắt buộc (Force)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {config?.force ? (
                <>
                  <CheckCircleOutlined style={{ color: "#f5222d", fontSize: 20 }} />
                  <Tag color="red" style={{ fontSize: 14, padding: "2px 8px" }}>ĐANG BẬT</Tag>
                </>
              ) : (
                <>
                  <StopOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                  <Tag color="green" style={{ fontSize: 14, padding: "2px 8px" }}>TỰ DO (TẮT)</Tag>
                </>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              {config?.force ? "Tất cả máy phải tự động nâng cấp" : "Tuân theo tùy chọn cá nhân của người dùng"}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>Yêu cầu Build tối thiểu</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: config?.min_build ? "#1677ff" : "#555" }}>
              {config?.min_build ? `Build ≥ ${config.min_build}` : "Tất cả các bản build"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              {config?.min_build ? "Chỉ ép buộc các máy dưới build này" : "Áp dụng toàn bộ thiết bị"}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>Kênh cập nhật chỉ định</div>
            <div style={{ fontSize: 16, fontWeight: "bold" }}>
              {config?.channel === "preview" ? (
                <Tag color="orange">Preview (dhphuc)</Tag>
              ) : config?.channel === "production" ? (
                <Tag color="blue">Production (main)</Tag>
              ) : (
                <Tag color="default">Kênh hiện tại của App</Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              Kênh OTA được tải bundle
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>Cập nhật lần cuối</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClockCircleOutlined style={{ color: "#888" }} />
              <span style={{ fontSize: 13, fontWeight: "500" }}>
                {config?.updated_at
                  ? new Date(config.updated_at).toLocaleString("vi-VN")
                  : "Chưa cấu hình"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {config?.message || "Không có ghi chú"}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Settings Card */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CloudSyncOutlined style={{ color: "#1677ff" }} />
            <span>Thiết lập Chỉ thị Cập nhật Bắt buộc</span>
          </div>
        }
        bordered
        style={{ borderRadius: 8, marginBottom: 24 }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Cơ chế Hoạt động Nâng cấp Bắt buộc (Force OTA)"
            description={
              <div>
                <p style={{ margin: "4px 0" }}>
                  - Khi <b>BẬT</b>: Ứng dụng di động khi khởi động hoặc truy cập hệ thống sẽ tự động kiểm tra bản cập nhật OTA từ máy chủ và <b>ngay lập tức tải và áp dụng</b>, bỏ qua cài đặt tắt OTA trong Cài đặt của người dùng.
                </p>
                <p style={{ margin: "4px 0" }}>
                  - Nếu thiết lập <b>Build tối thiểu</b>, các máy đã ở build đó trở lên sẽ không bị ép buộc tải lại.
                </p>
                <p style={{ margin: "4px 0" }}>
                  - Mọi thay đổi từ Admin Web hoặc lệnh CLI <code>php artisan app:ota</code> đều được lưu vào <b>Nhật ký hoạt động hệ thống (Audit Logs)</b>.
                </p>
              </div>
            }
            type={isForced ? "warning" : "info"}
            showIcon
          />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Bật chế độ bắt buộc nâng cấp (Force OTA):
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Switch
                    checked={isForced}
                    onChange={(checked) => setIsForced(checked)}
                    checkedChildren="BẬT"
                    unCheckedChildren="TẮT"
                  />
                  <span style={{ color: isForced ? "#d4380d" : "#666", fontWeight: isForced ? "600" : "normal" }}>
                    {isForced
                      ? "Đang ép buộc tất cả thiết bị đủ điều kiện tự động nâng cấp"
                      : "Thiết bị hoạt động theo chế độ cập nhật bình thường của người dùng"}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Yêu cầu Build tối thiểu (Tùy chọn):
                </label>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Ví dụ: 1025 (để trống nếu áp dụng mọi build)"
                  value={minBuild}
                  onChange={(val) => setMinBuild(val)}
                  min={1}
                />
                <span style={{ fontSize: 12, color: "#888", display: "block", marginTop: 4 }}>
                  Nếu nhập, chỉ những máy đang chạy build nhỏ hơn số này mới bị ép nâng cấp.
                </span>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Kênh cập nhật chỉ định (Channel):
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={targetChannel}
                  onChange={(val) => setTargetChannel(val)}
                  placeholder="Theo kênh hiện tại của ứng dụng"
                  allowClear
                  options={[
                    { value: "production", label: "Production (Nhánh ổn định main)" },
                    { value: "preview", label: "Preview (Nhánh xem trước dhphuc)" },
                  ]}
                />
                <span style={{ fontSize: 12, color: "#888", display: "block", marginTop: 4 }}>
                  Để trống để ứng dụng tự cập nhật theo kênh mà thiết bị đó đang đăng ký.
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                  Thông điệp / Lý do nâng cấp:
                </label>
                <Input.TextArea
                  rows={2}
                  placeholder="Ví dụ: Bản vá lỗi bảo mật quan trọng và cập nhật sự kiện mới"
                  value={reasonMessage}
                  onChange={(e) => setReasonMessage(e.target.value)}
                  maxLength={255}
                />
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "8px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Popconfirm
              title="Hủy chế độ bắt buộc nâng cấp?"
              description="Ứng dụng trên các thiết bị sẽ quay trở lại hoạt động theo tùy chọn cập nhật của người dùng."
              onConfirm={handleResetToNormal}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger icon={<StopOutlined />} loading={saving}>
                Hủy chế độ bắt buộc (Reset)
              </Button>
            </Popconfirm>

            <Space>
              <Button onClick={fetchConfig} disabled={saving}>
                Hủy thay đổi
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                Lưu cấu hình nâng cấp
              </Button>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
}
