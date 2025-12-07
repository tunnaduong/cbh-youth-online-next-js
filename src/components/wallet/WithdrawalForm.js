"use client";

import { useState } from "react";
import { requestWithdrawal } from "@/app/Api";
import { message } from "antd";
import { useRouter } from "next/navigation";

export default function WithdrawalForm({ balance }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bank_account: "",
    bank_name: "",
    account_holder: "",
  });

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

  return (
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
      </div>
    </form>
  );
}

