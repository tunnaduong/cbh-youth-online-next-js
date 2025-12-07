"use client";

export default function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        Chưa có giao dịch nào
      </p>
    );
  }

  return (
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
          <div
            className={`font-semibold ${
              transaction.amount > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.amount > 0 ? "+" : ""}
            {transaction.amount.toLocaleString()} điểm
          </div>
        </div>
      ))}
    </div>
  );
}



