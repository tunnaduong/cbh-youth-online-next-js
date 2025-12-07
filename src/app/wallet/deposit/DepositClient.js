"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, createDepositRequest } from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import { Wallet, CopyOutline, CheckmarkOutline } from "react-ionicons";

export default function DepositClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositInfo, setDepositInfo] = useState(null);
  const [copied, setCopied] = useState(false);

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
    loadBalance();
  }, [loggedIn, router]);

  const loadBalance = async () => {
    try {
      const response = await getWalletBalance();
      setBalance(response.data);
    } catch (err) {
      message.error("Không thể tải số dư");
    }
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();

    const amountVND = parseInt(amount);
    if (!amountVND || amountVND < 10000) {
      message.warning("Số tiền tối thiểu là 10.000 VND");
      return;
    }

    try {
      setLoading(true);
      const response = await createDepositRequest({ amount_vnd: amountVND });
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
    <HomeLayout activeNav="explore" sidebarItems={sidebarItems}>
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Link
            href="/wallet"
            className="text-green-600 hover:text-green-700 mb-4 inline-block"
          >
            ← Quay lại ví
          </Link>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Nạp tiền vào ví
            </h1>

            {!depositInfo ? (
              <form onSubmit={handleCreateDeposit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold">
                    Số tiền muốn nạp (VND) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    min="10000"
                    step="1000"
                    required
                  />
                  {amount && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Số điểm nhận được:{" "}
                      {Math.floor((parseInt(amount) || 0 - 1000) / 1000 * 10)} điểm
                      <span className="text-orange-600 dark:text-orange-400">
                        {" "}(phí: 1.000 VND = 10 điểm)
                      </span>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Lưu ý:</strong> Phí nạp tiền là 1.000 VND (10 điểm) sẽ được trừ từ số
                    tiền nạp. Sau khi chuyển khoản, điểm sẽ được cộng tự động vào ví của bạn.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Đang tạo..." : "Tạo mã nạp tiền"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
                  <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">
                    Hướng dẫn nạp tiền
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">Bước 1: Chuyển khoản</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Chuyển khoản <strong>{depositInfo.amount_vnd.toLocaleString()} VND</strong>{" "}
                        đến tài khoản ngân hàng của hệ thống
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Bước 2: Nội dung chuyển khoản</p>
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-700 rounded border-2 border-green-500">
                        <code className="flex-1 font-mono text-lg font-bold">
                          {depositInfo.deposit_code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(depositInfo.deposit_code)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded"
                        >
                          {copied ? (
                            <CheckmarkOutline color="#10b981" height="20px" width="20px" />
                          ) : (
                            <CopyOutline color="#6b7280" height="20px" width="20px" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ⚠️ Quan trọng: Phải ghi đúng nội dung này khi chuyển khoản
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Bước 3: Chờ xử lý</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Sau khi chuyển khoản, hệ thống sẽ tự động cộng{" "}
                        <strong>{depositInfo.expected_points} điểm</strong> vào ví của bạn (đã trừ
                        phí 10 điểm).
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ⏰ Mã này có hiệu lực trong 24 giờ. Mã hết hạn:{" "}
                        {new Date(depositInfo.expires_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDepositInfo(null);
                    setAmount("");
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600"
                >
                  Tạo mã mới
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

