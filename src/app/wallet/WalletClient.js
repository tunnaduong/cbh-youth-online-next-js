"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, getWalletTransactions } from "@/app/Api";
import { message, Button, Card, Typography, Space, Divider, Empty, Spin } from "antd";
import Link from "next/link";
import { WalletOutline, CashOutline, AddCircleOutline } from "react-ionicons";

const { Title, Text, Paragraph } = Typography;

export default function WalletClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
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
  ];

  useEffect(() => {
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
      const [balanceRes, transactionsRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
      ]);
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.data || []);
    } catch (err) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
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
            <Button
              type="primary"
              size="large"
              className="h-12 px-8 rounded-xl font-semibold bg-green-600 border-none hover:!bg-green-700"
              onClick={() => router.push("/wallet/withdraw")}
            >
              Rút tiền
            </Button>
            <Button
              type="primary"
              variant="outlined"
              size="large"
              className="h-12 px-8 rounded-xl font-semibold bg-blue-600 border-none hover:!bg-blue-700"
              onClick={() => router.push("/wallet/deposit")}
            >
              Nạp tiền
            </Button>
          </Space>

          {/* Transactions */}
          <Card
            title={<Title level={4} className="!m-0 dark:text-gray-100">Lịch sử giao dịch</Title>}
            className="rounded-2xl shadow-sm border-none dark:bg-neutral-800 overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            {transactions.length === 0 ? (
              <div className="py-12">
                <Empty description="Chưa có giao dịch nào" />
              </div>
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
          </Card>
        </main>
      </div>
    </HomeLayout>
  );
}

