"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, createDepositRequest } from "@/app/Api";
import { message, Button, Card, Typography, Space, Form, Alert, Breadcrumb, Input, InputNumber } from "antd";
// import { Input, InputNumber } from "@/components/ui/input";
import Link from "next/link";
import { WalletOutline, CashOutline, AddCircleOutline } from "react-ionicons";

const { Title, Text, Paragraph } = Typography;

export default function DepositClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form] = Form.useForm();

  const sidebarItems = [
    {
      key: "wallet",
      href: "/wallet",
      label: "Ví điểm",
      Icon: WalletOutline,
    },
    {
      key: "withdraw",
      href: "/wallet/withdraw",
      label: "Rút tiền",
      Icon: CashOutline,
    },
    {
      key: "deposit",
      href: "/wallet/deposit",
      label: "Nạp tiền",
      Icon: AddCircleOutline,
    },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!loggedIn) {
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }
    loadBalance();
  }, [loggedIn, authLoading, router]);

  const loadBalance = async () => {
    try {
      const response = await getWalletBalance();
      setBalance(response.data);
    } catch (err) {
      message.error("Không thể tải số dư");
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await createDepositRequest({ amount_vnd: values.amount_vnd });
      setDepositInfo(response.data);
      message.success("Đã tạo mã nạp tiền!");
    } catch (err) {
      message.error(err.response?.data?.message || "Tạo mã nạp tiền thất bại");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    message.success("Đã sao chép!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <HomeLayout activeNav="explore" sidebarItems={sidebarItems} showRightSidebar={false} activeBar="deposit" sidebarType="wallet">
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Breadcrumb
            className="mb-6"
            items={[
              {
                title: <Link href="/wallet">Ví điểm của tôi</Link>,
              },
              {
                title: "Nạp tiền",
              },
            ]}
          />

          <Card
            className="rounded-2xl shadow-sm border-none dark:bg-neutral-800"
            bodyStyle={{ padding: '32px' }}
          >
            <Title level={3} className="mb-8 dark:text-gray-100">
              Nạp tiền vào ví
            </Title>

            {!depositInfo ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ amount_vnd: 50000 }}
                className="max-w-xl"
              >
                <Form.Item
                  label={<Text strong>Số tiền muốn nạp (VND)</Text>}
                  name="amount_vnd"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số tiền' },
                    { type: 'number', min: 10000, message: 'Số tiền tối thiểu là 10.000 VND' }
                  ]}
                >
                  <InputNumber
                    className="w-full !h-12 !rounded-xl overflow-hidden flex items-center"
                    placeholder="Nhập số tiền (VND)"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    step={10000}
                    controls={true}
                  />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => prevValues.amount_vnd !== currentValues.amount_vnd}
                >
                  {({ getFieldValue }) => {
                    const amountVnd = getFieldValue('amount_vnd') || 0;
                    return amountVnd > 0 ? (
                      <Paragraph className="text-sm text-gray-500 mt-[-20px] mb-4">
                        Số điểm nhận được:{" "}
                        <Text strong className="text-green-600">
                          {Math.floor(Math.max(0, amountVnd - 1000) / 1000 * 10)} điểm
                        </Text>
                        <Text type="secondary" className="ml-2">
                          (phí: 1.000 VND = 10 điểm)
                        </Text>
                      </Paragraph>
                    ) : null;
                  }}
                </Form.Item>

                <Alert
                  message={<Text strong>Lưu ý</Text>}
                  description="Phí nạp tiền là 1.000 VND (10 điểm) sẽ được trừ từ số tiền nạp. Sau khi chuyển khoản, điểm sẽ được cộng tự động vào ví của bạn."
                  type="info"
                  showIcon
                  className="mb-8 rounded-xl"
                />

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="h-12 px-10 rounded-xl font-bold bg-green-600 border-none hover:!bg-green-700"
                  >
                    Tạo mã nạp tiền
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <div className="space-y-8">
                <Card
                  className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 rounded-2xl overflow-hidden"
                  bodyStyle={{ padding: '32px' }}
                >
                  <Title level={4} className="mb-6 !text-green-800 dark:!text-green-200">
                    Hướng dẫn nạp tiền
                  </Title>

                  <div className="space-y-8">
                    <div>
                      <Text strong className="block text-base mb-2">Bước 1: Chuyển khoản</Text>
                      <Paragraph className="m-0 text-gray-700 dark:text-gray-300">
                        Chuyển khoản <Text strong className="text-lg underline underline-offset-4 decoration-green-500">{depositInfo.amount_vnd.toLocaleString()} VND</Text> đến tài khoản ngân hàng của hệ thống
                      </Paragraph>
                    </div>

                    <div>
                      <Text strong className="block text-base mb-2">Bước 2: Nội dung chuyển khoản</Text>
                      <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 border-2 border-green-500 rounded-2xl shadow-sm">
                        <code className="flex-1 font-mono text-xl font-black tracking-wider dark:text-gray-100">
                          {depositInfo.deposit_code}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(depositInfo.deposit_code)}
                          className="flex items-center justify-center border-none shadow-none bg-gray-50 dark:bg-neutral-700 h-10 w-max px-4 rounded-xl"
                        >
                          {copied ? "Đã chép" : "Sao chép"}
                        </Button>
                      </div>
                      <Text type="danger" className="text-xs mt-3 block italic font-medium">
                        ⚠️ Quan trọng: Phải ghi đúng nội dung này khi chuyển khoản
                      </Text>
                    </div>

                    <div>
                      <Text strong className="block text-base mb-2">Bước 3: Chờ xử lý</Text>
                      <Paragraph className="m-0 text-gray-700 dark:text-gray-300">
                        Sau khi chuyển khoản thành công, hệ thống sẽ tự động cộng <Text strong className="text-green-600">{depositInfo.expected_points} điểm</Text> vào ví của bạn (đã trừ phí 10 điểm).
                      </Paragraph>
                    </div>

                    <Alert
                      message={
                        <Text className="text-xs font-medium">
                          ⏰ Mã có hiệu lực đến: <Text strong>{new Date(depositInfo.expires_at).toLocaleString("vi-VN")}</Text>
                        </Text>
                      }
                      type="warning"
                      className="rounded-xl border-none"
                    />
                  </div>
                </Card>

                <Button
                  size="large"
                  onClick={() => {
                    setDepositInfo(null);
                    form.resetFields();
                  }}
                  className="h-12 px-10 rounded-xl font-medium"
                >
                  Tạo mã mới
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>
    </HomeLayout>
  );
}

