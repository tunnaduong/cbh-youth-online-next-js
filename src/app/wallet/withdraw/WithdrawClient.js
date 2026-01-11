"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, requestWithdrawal } from "@/app/Api";
import { message, Button, Card, Typography, Space, Form, Divider, Breadcrumb, Input, InputNumber } from "antd";
// import { Input, InputNumber } from "@/components/ui/input";
import Link from "next/link";
import { WalletOutline, CashOutline, AddCircleOutline } from "react-ionicons";

const { Title, Text, Paragraph } = Typography;

export default function WithdrawClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
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
    const amount = parseInt(values.amount);
    if (amount > (balance?.points || 0)) {
      message.warning("Số điểm không đủ");
      return;
    }

    try {
      setLoading(true);
      await requestWithdrawal({
        amount: amount,
        bank_account: values.bank_account,
        bank_name: values.bank_name,
        account_holder: values.account_holder,
      });
      message.success("Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin duyệt.");
      router.push("/wallet");
    } catch (err) {
      message.error(err.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <HomeLayout activeNav="explore" sidebarItems={sidebarItems} showRightSidebar={false} activeBar="withdraw" sidebarType="wallet">
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Breadcrumb
            className="mb-6"
            items={[
              {
                title: <Link href="/wallet">Ví điểm của tôi</Link>,
              },
              {
                title: "Rút tiền",
              },
            ]}
          />

          <Card
            className="rounded-2xl shadow-sm border-none dark:bg-neutral-800"
            bodyStyle={{ padding: '32px' }}
          >
            <Title level={3} className="mb-8 dark:text-gray-100">
              Yêu cầu rút tiền
            </Title>

            {balance && (
              <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <Space direction="vertical" size="small" className="w-full">
                  <Text className="text-gray-600 dark:text-gray-400">
                    Số dư hiện tại: <Text strong>{balance.points.toLocaleString()} điểm</Text>
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    Mức tối thiểu: <Text strong>{balance.min_withdrawal_points} điểm</Text> ({balance.min_withdrawal_vnd.toLocaleString()} VND)
                  </Text>
                  <Divider className="my-2" />
                  <Text type="warning" className="text-sm italic">
                    Lưu ý: Phí rút tiền là 10 điểm (1.000 VND) sẽ được trừ khi admin duyệt.
                  </Text>
                  <Text type="secondary" className="text-sm mt-2 block">
                    Ví dụ: Khách hàng chi trả 100 điểm để mua tài liệu của bạn. Bạn nhận được 70% doanh thu = 70 điểm (Quy đổi 10 điểm = 1.000 đ)
                  </Text>
                </Space>
              </div>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="max-w-xl"
              initialValues={{ amount: 500 }}
            >
              <Form.Item
                label={<Text strong>Số điểm muốn rút</Text>}
                name="amount"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điểm' },
                  { type: 'number', min: 500, message: 'Số điểm tối thiểu là 500' }
                ]}
              >
                <InputNumber
                  className="w-full !h-full !rounded-xl overflow-hidden"
                  placeholder="Nhập số điểm cần rút"
                  step={10}
                  controls={true}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.amount !== currentValues.amount}
              >
                {({ getFieldValue }) => {
                  const amount = getFieldValue('amount') || 0;
                  return amount > 0 ? (
                    <Paragraph className="text-sm text-gray-500 mt-[-20px] mb-4">
                      ≈ {(amount / 10 * 1000).toLocaleString()} VND
                      {amount >= 500 && (
                        <Text type="warning" className="ml-2">
                          (sau phí: {((amount - 10) / 10 * 1000).toLocaleString()} VND)
                        </Text>
                      )}
                    </Paragraph>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                label={<Text strong>Số tài khoản ngân hàng</Text>}
                name="bank_account"
                rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
              >
                <Input className="!rounded-xl" placeholder="Số tài khoản của bạn" />
              </Form.Item>

              <Form.Item
                label={<Text strong>Tên ngân hàng</Text>}
                name="bank_name"
                rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng' }]}
              >
                <Input className="!rounded-xl" placeholder="VD: Vietcombank, Techcombank..." />
              </Form.Item>

              <Form.Item
                label={<Text strong>Tên chủ tài khoản</Text>}
                name="account_holder"
                rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
              >
                <Input className="!rounded-xl" placeholder="NGUYEN VAN A" />
              </Form.Item>

              <Form.Item className="mt-8">
                <Space size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="h-12 px-10 rounded-xl font-bold bg-green-600 border-none hover:!bg-green-700"
                  >
                    Gửi yêu cầu
                  </Button>
                  <Button
                    size="large"
                    className="h-12 px-10 rounded-xl font-medium dark:bg-neutral-700 dark:border-neutral-600 dark:text-gray-300"
                    onClick={() => router.push("/wallet")}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </main>
      </div>
    </HomeLayout>
  );
}

