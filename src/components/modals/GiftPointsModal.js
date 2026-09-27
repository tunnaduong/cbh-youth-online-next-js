"use client";

import { useEffect, useState } from "react";
import { Modal, Input, InputNumber, message, Button } from "antd";
import { Gift } from "lucide-react";
import { giftPoints, getWalletBalance } from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";

const { TextArea } = Input;

const QUICK_AMOUNTS = [10, 20, 50, 100];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;
const REQUIRED_TIER_POINTS = 150;

/**
 * Gift points to a post's author. The recipient is resolved server-side from
 * `post.id`, so an anonymous author stays anonymous to the sender.
 */
export default function GiftPointsModal({ open, onClose, post, onSuccess }) {
  const { currentUser, refreshUser } = useAuthContext();
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAnonymous = !!post?.anonymous;
  const authorName = isAnonymous
    ? "tác giả ẩn danh"
    : post?.author?.profile_name || post?.author?.username || "tác giả";

  const canGift =
    currentUser?.role === "admin" ||
    !!currentUser?.member_tier?.privileges?.includes("gift_points_to_others") ||
    (currentUser?.total_points ?? 0) >= REQUIRED_TIER_POINTS;

  useEffect(() => {
    if (!open) return;
    setAmount(10);
    setNote("");
    setError(null);
    setBalance(null);
    let cancelled = false;
    getWalletBalance()
      .then((res) => {
        if (!cancelled) setBalance(res?.data?.points ?? res?.points ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const validAmount =
    Number.isInteger(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const insufficient = balance !== null && validAmount && amount > balance;

  const handleSubmit = async () => {
    if (!validAmount) {
      setError(`Số điểm phải từ ${MIN_AMOUNT} đến ${MAX_AMOUNT.toLocaleString()}.`);
      return;
    }
    if (insufficient) {
      setError(`Số dư không đủ. Bạn đang có ${balance.toLocaleString()} điểm.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await giftPoints({
        topic_id: post.id,
        amount,
        message: note.trim() || undefined,
      });
      const data = res?.data ?? res;
      message.success(
        `Đã tặng ${amount.toLocaleString()} điểm cho ${authorName}.`
      );
      refreshUser?.();
      onSuccess?.(data);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể tặng điểm lúc này. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Gift size={18} className="text-[#319527]" />
          Tặng điểm cho {authorName}
        </span>
      }
      centered
      destroyOnClose
      onOk={handleSubmit}
      okText={`Tặng ${validAmount ? amount.toLocaleString() : ""} điểm`}
      cancelText="Hủy"
      okButtonProps={{
        loading: submitting,
        disabled: !validAmount || insufficient,
        className: "!bg-[#319527] hover:!bg-[#2a7f21]",
      }}
      cancelButtonProps={{ disabled: submitting }}
      footer={canGift ? undefined : null}
    >
      {!canGift ? (
        <div className="py-2">
          <p className="text-sm text-gray-700 dark:text-neutral-300">
            Tính năng tặng điểm dành cho hạng{" "}
            <b>Thành viên tích cực</b> trở lên (từ {REQUIRED_TIER_POINTS} điểm).
            Bạn đang có{" "}
            <b>{(currentUser?.total_points ?? 0).toLocaleString()} điểm</b>.
          </p>
          <div className="flex justify-end mt-4">
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-sm text-gray-500 dark:text-neutral-400 !mb-0">
            Điểm sẽ được trừ khỏi ví của bạn và cộng thẳng vào ví của {authorName}.
            {balance !== null && (
              <>
                {" "}
                Số dư hiện tại: <b>{balance.toLocaleString()} điểm</b>.
              </>
            )}
          </p>

          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    amount === v
                      ? "bg-[#319527] border-[#319527] text-white"
                      : "border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 hover:border-[#319527]"
                  }`}
                >
                  {v} điểm
                </button>
              ))}
            </div>
            <InputNumber
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              value={amount}
              onChange={(v) => setAmount(typeof v === "number" ? Math.floor(v) : v)}
              addonAfter="điểm"
              className="w-full"
              size="large"
              disabled={submitting}
            />
          </div>

          {/* antd draws the character counter below the textarea without
              reserving space for it, so leave room before the footer. */}
          <div className="pb-4">
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lời nhắn (không bắt buộc)"
              maxLength={200}
              showCount
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-red-500 !mb-0">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
