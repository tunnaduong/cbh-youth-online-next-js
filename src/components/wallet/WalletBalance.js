"use client";

import { WalletOutline } from "react-ionicons";

export default function WalletBalance({ balance }) {
  if (!balance) return null;

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-green-100 mb-2">Số dư hiện tại</p>
          <p className="text-3xl font-bold">{balance.points.toLocaleString()} điểm</p>
          <p className="text-green-100 mt-2">≈ {balance.formatted_vnd}</p>
        </div>
        <WalletOutline color="#fff" height="48px" width="48px" />
      </div>
      <div className="mt-4 pt-4 border-t border-green-400">
        <p className="text-sm text-green-100">
          Mức tối thiểu rút: {balance.min_withdrawal_points} điểm (
          {balance.min_withdrawal_vnd.toLocaleString()} VND)
        </p>
      </div>
    </div>
  );
}



