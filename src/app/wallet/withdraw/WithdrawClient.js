"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { getWalletBalance, requestWithdrawal } from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import { Wallet } from "react-ionicons";

export default function WithdrawClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bank_account: "",
    bank_name: "",
    account_holder: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseInt(formData.amount);
    if (!amount || amount < 500) {
      message.warning("Số điểm tối thiểu là 500 điểm");
      return;
    }

    if (amount > (balance?.points || 0)) {
      message.warning("Số điểm không đủ");
      return;
    }

    if (!formData.bank_account || !formData.bank_name || !formData.account_holder) {
      message.warning("Vui lòng điền đầy đủ thông tin ngân hàng");
      return;
    }

    try {
      setLoading(true);
      await requestWithdrawal({
        amount: amount,
        bank_account: formData.bank_account,
        bank_name: formData.bank_name,
        account_holder: formData.account_holder,
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
              Yêu cầu rút tiền
            </h1>

            {balance && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Số dư hiện tại: <span className="font-semibold">{balance.points.toLocaleString()} điểm</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mức tối thiểu: <span className="font-semibold">{balance.min_withdrawal_points} điểm</span> ({balance.min_withdrawal_vnd.toLocaleString()} VND)
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Lưu ý: Phí rút tiền là 10 điểm (1.000 VND) sẽ được trừ khi admin duyệt.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold">Số điểm muốn rút *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  min="500"
                  step="10"
                  required
                />
                {formData.amount && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ≈ {((parseInt(formData.amount) || 0) / 10 * 1000).toLocaleString()} VND
                    {formData.amount >= 500 && (
                      <span className="text-orange-600 dark:text-orange-400">
                        {" "}(sau phí: {((parseInt(formData.amount) || 0) - 10) / 10 * 1000} VND)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Tên ngân hàng *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  placeholder="VD: Vietcombank, Techcombank..."
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Tên chủ tài khoản *</label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
                <Link
                  href="/wallet"
                  className="px-6 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600"
                >
                  Hủy
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

