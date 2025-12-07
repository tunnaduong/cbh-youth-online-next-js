"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, getWalletTransactions } from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import { WalletOutline, Wallet } from "react-ionicons";

export default function WalletClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarItems = [
    {
      key: "wallet",
      href: "/wallet",
      label: "Ví điểm",
      Icon: Wallet,
      isExternal: false,
    },
  ];

  useEffect(() => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    loadData();
  }, [loggedIn, router]);

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
      <HomeLayout activeNav="explore" sidebarItems={sidebarItems}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout activeNav="explore" sidebarItems={sidebarItems}>
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Ví điểm của tôi
          </h1>

          {/* Balance Card */}
          {balance && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-100 mb-2">Số dư hiện tại</p>
                  <p className="text-3xl font-bold">{balance.points.toLocaleString()} điểm</p>
                  <p className="text-green-100 mt-2">
                    ≈ {balance.formatted_vnd}
                  </p>
                </div>
                <WalletOutline color="#fff" height="48px" width="48px" />
              </div>
              <div className="mt-4 pt-4 border-t border-green-400">
                <p className="text-sm text-green-100">
                  Mức tối thiểu rút: {balance.min_withdrawal_points} điểm ({balance.min_withdrawal_vnd.toLocaleString()} VND)
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <Link
              href="/wallet/withdraw"
              className={`px-6 py-3 rounded-lg font-semibold ${
                balance && balance.points >= balance.min_withdrawal_points
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              Rút tiền
            </Link>
            <Link
              href="/wallet/deposit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-block text-center"
            >
              Nạp tiền
            </Link>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Lịch sử giao dịch</h2>
            {transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có giao dịch nào
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-neutral-700 last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString()} điểm
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

