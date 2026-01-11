"use client";


import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import * as API from "@/app/Api";
import * as ApiCaller from "@/services/api/ApiByAxios";
const {
  getWalletBalance,
  getWalletTransactions,
  getWithdrawalRequests
} = API;

import { message, Button, Card, Typography, Space, Divider, Empty, Spin, Popconfirm } from "antd";
import Link from "next/link";
import { WalletOutline, CashOutline, AddCircleOutline, HelpCircleOutline, DocumentTextOutline } from "react-ionicons";

const { Title, Text, Paragraph } = Typography;

export default function WalletClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    console.log("API Exports:", API);
    if (authLoading) return;
    if (!loggedIn) {
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }
    loadData();
  }, [loggedIn, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes, withdrawalRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
        getWithdrawalRequests(),
      ]);
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.data || []);
      setWithdrawalRequests(withdrawalRes.data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await ApiCaller.postRequest(`/v1.0/wallet/withdrawal-requests/${id}/cancel`);
      message.success("Đã hủy yêu cầu rút tiền thành công");
      loadData();
    } catch (err) {
      console.error("Cancel failed:", err);
      message.error(`Lỗi ${err?.response?.status || 'Unknown'}: ${err?.response?.data?.message || err?.message || "Không thể hủy yêu cầu"}`);
    }
  };

  const statusColors = {
    pending: "text-yellow-600 bg-yellow-100",
    approved: "text-green-600 bg-green-100",
    completed: "text-green-600 bg-green-100",
    rejected: "text-red-600 bg-red-100",
    cancelled: "text-gray-600 bg-gray-100",
  };

  const statusLabels = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    completed: "Hoàn tất",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  };

  if (!loggedIn) {
    return null;
  }

  if (loading) {
    return (
      <HomeLayout activeNav="explore" sidebarItems={sidebarItems} showRightSidebar={false} sidebarType="wallet">
        <div className="flex justify-center items-center py-24">
          <Spin size="large" />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout activeNav="explore" sidebarItems={sidebarItems} showRightSidebar={false} activeBar="wallet" sidebarType="wallet">
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Title level={2} className="mb-6 dark:text-gray-100">
            Ví điểm của tôi
          </Title>

          {/* Balance Card */}
          {balance && (
            <Card
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg border-none mb-6 overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex justify-between items-center text-white">
                <div>
                  <Text className="text-green-100 mb-2 block">Số dư hiện tại</Text>
                  <Title level={1} className="m-0 !text-white !font-bold">
                    {balance.points.toLocaleString()} điểm
                  </Title>
                  <Text className="text-green-100 mt-2 block">
                    ≈ {balance.formatted_vnd}
                  </Text>
                </div>
                <div className="opacity-80">
                  <WalletOutline color="#fff" height="64px" width="64px" />
                </div>
              </div>
              <Divider className="my-4 border-green-400 opacity-50" />
              <div className="text-green-100 text-sm">
                Mức tối thiểu rút: {balance.min_withdrawal_points} điểm ({balance.min_withdrawal_vnd.toLocaleString()} VND)
              </div>
            </Card>
          )}

          {/* Actions */}
          <Space size="large" className="mb-8 w-full">
            <Link href="/wallet/withdraw" className="w-full">
              <Button
                type="primary"
                size="large"
                className="h-12 px-8 rounded-xl font-semibold bg-green-600 border-none hover:!bg-green-700"
              >
                Rút tiền
              </Button>
            </Link>
            <Link href="/wallet/deposit" className="w-full">
              <Button
                type="primary"
                variant="outlined"
                size="large"
                className="h-12 px-8 rounded-xl font-semibold bg-blue-600 border-none hover:!bg-blue-700"
              >
                Nạp tiền
              </Button>
            </Link>
          </Space>

          {/* Tabs */}
          <Card
            className="rounded-2xl shadow-sm border-none dark:bg-neutral-800 overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-0">
              <div className="bg-gray-50 dark:bg-neutral-800/50 px-6 py-3 font-semibold text-gray-500 text-sm uppercase mt-4">
                Lịch sử rút tiền
              </div>
              {withdrawalRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Chưa có yêu cầu rút tiền nào</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {withdrawalRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong className="block text-base dark:text-gray-200">
                            Rút {req.amount.toLocaleString()} điểm
                          </Text>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-600'} `}>
                            {statusLabels[req.status] || req.status}
                          </span>
                        </div>
                        <Text type="secondary" className="text-xs block">
                          Ngân hàng: {req.bank_name} - {req.bank_account} ({req.account_holder})
                        </Text>
                        <Text type="secondary" className="text-xs">
                          {new Date(req.created_at).toLocaleString("vi-VN")}
                        </Text>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-red-600 dark:text-red-500">
                          -{req.amount.toLocaleString()} <span className="text-sm font-normal">điểm</span>
                        </div>
                        {req.status === 'pending' && (
                          <Popconfirm
                            title="Hủy yêu cầu rút tiền?"
                            description="Số điểm sẽ được hoàn lại vào ví của bạn."
                            onConfirm={() => handleCancelRequest(req.id)}
                            okText="Hủy yêu cầu"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                          >
                            <Button size="small" danger>Hủy lệnh</Button>
                          </Popconfirm>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-neutral-800/50 px-6 py-3 font-semibold text-gray-500 text-sm uppercase">
                Lịch sử giao dịch
              </div>
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Chưa có giao dịch nào</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div>
                        <Text strong className="block text-base dark:text-gray-200">
                          {transaction.description}
                        </Text>
                        <Text type="secondary" className="text-xs">
                          {new Date(transaction.created_at).toLocaleString("vi-VN")}
                        </Text>
                      </div>
                      <div className={`text-lg font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-500"
                        }`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount.toLocaleString()}
                        <span className="text-sm font-normal ml-1">điểm</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    </HomeLayout>
  );
}

