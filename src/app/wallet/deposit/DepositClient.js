"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, createDepositRequest } from "@/app/Api";
import { message, Button, Card, Typography, Space, Form, Alert, Breadcrumb, Input, InputNumber } from "antd";
// import { Input, InputNumber } from "@/components/ui/input";
import Link from "next/link";
import { WalletOutline, CashOutline, AddCircleOutline, HelpCircleOutline, DocumentTextOutline, CheckmarkCircleOutline } from "react-ionicons";

const { Title, Text, Paragraph } = Typography;

export default function DepositClient() {
  const { loggedIn, authLoading, currentUser } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialPoints, setInitialPoints] = useState(0);
  const { width, height } = useWindowSize();
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
    { type: "divider" },
    {
      key: "help",
      href: "/help",
      label: "Trợ giúp",
      Icon: HelpCircleOutline,
    },
    {
      key: "policy",
      href: "/help/cho-tai-lieu-on-thi/chinh-sach-ban-tai-lieu",
      label: "Chính sách bán tài liệu",
      Icon: DocumentTextOutline,
    },
  ];

  useEffect(() => {
    let interval;
    if (depositInfo && !success) {
      // Start polling balance every 3 seconds
      interval = setInterval(async () => {
        try {
          const res = await getWalletBalance();
          const currentPoints = res.data.points;
          // Nếu số dư mới > số dư ban đầu, tức là đã nạp tiền
          if (currentPoints > initialPoints) {
            setSuccess(true);
            setDepositInfo(null); // Ẩn QR form
            setBalance(res.data); // Update balance display
            clearInterval(interval);
            message.success("Nạp tiền thành công!");
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [depositInfo, success, initialPoints]);

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
      if (initialPoints === 0 && response.data.points > 0) {
        setInitialPoints(response.data.points);
      } else if (initialPoints === 0) {
        setInitialPoints(0);
      }
    } catch (err) {
      message.error("Không thể tải số dư");
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Snapshot số dư hiện tại để so sánh khi polling
      setInitialPoints(balance?.points || 0);
      setSuccess(false); // Reset success state

      // Cấu hình thông tin tài khoản nhận tiền (Nên lấy từ Env hoặc API config)
      const accountNo = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NO || "99421112003";
      const bankName = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || "TPBank";
      const template = "compact"; // compact, print, etc.

      // Nội dung chuyển khoản: MW + ID + UnixTimestamp (created_at)
      let timestamp = "";
      if (currentUser?.created_at) {
        timestamp = Math.floor(new Date(currentUser.created_at).getTime() / 1000);
      }
      const content = `MW${currentUser?.id}${timestamp}`;
      const amount = values.amount_vnd;

      // Tạo QR URL SePay
      const qrUrl = `https://qr.sepay.vn/img?acc=${accountNo}&bank=${bankName}&amount=${amount}&des=${content}&template=${template}`;

      // Tính điểm dự kiến (1000 VND = 10 điểm) -> amount / 100
      const expectedPoints = Math.floor(amount / 100);

      setDepositInfo({
        amount_vnd: amount,
        deposit_code: content,
        qr_url: qrUrl,
        expected_points: expectedPoints,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Giả lập hết hạn để user chú ý
      });

      message.success("Đã tạo mã QR nạp tiền!");
    } catch (err) {
      console.error(err);
      message.error("Lỗi tạo mã");
    } finally {
      setLoading(false);
    }
  };

  const copyContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    message.success("Đã sao chép nội dung!");
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const copyAccount = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    message.success("Đã sao chép số tài khoản!");
    setTimeout(() => setCopiedAccount(false), 2000);
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

            {success ? (
              <div className="text-center py-12">
                <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />
                <div className="flex justify-center mb-6">
                  <CheckmarkCircleOutline color="#10b981" height="120px" width="120px" />
                </div>
                <Title level={2} className="!text-green-600 mb-2">Thanh toán thành công!</Title>
                <Paragraph className="text-lg text-gray-500 mb-8">
                  Số điểm đã được cộng vào ví của bạn.
                </Paragraph>
                <Link href="/wallet">
                  <Button type="primary" size="large" className="h-12 px-10 rounded-xl font-bold bg-green-600 border-none hover:!bg-green-700">
                    Kiểm tra ví ngay
                  </Button>
                </Link>
                <div className="mt-4">
                  <Button type="link" onClick={() => { setSuccess(false); form.resetFields(); }}>
                    Nạp thêm lần nữa
                  </Button>
                </div>
              </div>
            ) : !depositInfo ? (
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
                        Chuyển khoản <Text strong className="text-lg underline underline-offset-4 decoration-green-500">{depositInfo.amount_vnd.toLocaleString()} VND</Text> đến tài khoản ngân hàng của hệ thống bằng cách quét mã QR bên dưới hoặc chuyển khoản thủ công.
                      </Paragraph>

                      <div className="mt-4 flex justify-center">
                        <img
                          src={depositInfo.qr_url}
                          alt="QR Code Chuyển khoản"
                          className="max-w-xs border rounded-xl shadow-sm"
                        />
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700">
                        <Text strong className="block mb-3 text-center uppercase text-gray-500 text-xs">Thông tin chuyển khoản thủ công</Text>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Ngân hàng</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">TP Bank</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Số tài khoản</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">99421112003</span>
                              <Text className="text-green-600 cursor-pointer text-xs font-medium" onClick={() => copyAccount("99421112003")}>
                                {copiedAccount ? "Đã chép" : "Sao chép"}
                              </Text>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Chủ tài khoản</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">DUONG TUNG ANH</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Text strong className="block text-base mb-2">Bước 2: Nội dung chuyển khoản</Text>
                      <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 border-2 border-green-500 rounded-2xl shadow-sm">
                        <code className="bg-white dark:bg-neutral-800 flex-1 font-mono text-xl font-black tracking-wider dark:text-gray-100">
                          {depositInfo.deposit_code}
                        </code>
                        <Button
                          onClick={() => copyContent(depositInfo.deposit_code)}
                          className="flex items-center justify-center border-none shadow-none bg-gray-50 dark:bg-neutral-700 h-10 w-max px-4 rounded-xl"
                        >
                          {copiedContent ? "Đã chép" : "Sao chép"}
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
        </main >
      </div >
    </HomeLayout >
  );
}

