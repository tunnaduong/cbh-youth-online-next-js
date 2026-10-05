"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal, message } from "antd";
import { ShieldCheck } from "lucide-react";
import dayjs from "dayjs";
import { useAuthContext } from "@/contexts/Support";
import { getEcho } from "@/lib/echo";
import { getLoginApprovals, respondLoginApproval } from "@/app/Api";

const PLATFORM_LABELS = {
  web: "Web",
  ios: "Ứng dụng iOS",
  android: "Ứng dụng Android",
};

/**
 * Two-factor by approval (method "device"): when someone is logging in to
 * this account elsewhere and waits for an OK, this browser - already logged
 * in - shows the request: which device, and three numbers. Picking the
 * number shown on the device logging in approves it; "not me" denies it.
 *
 * It learns about a request from the realtime event and by asking the API
 * when the tab is opened or looked at again. Mounted once for the whole
 * site; renders nothing while logged out or when nothing is waiting.
 */
export default function LoginApprovalPrompt() {
  const { loggedIn, currentUser } = useAuthContext();
  const userId = currentUser?.id;

  const [approvals, setApprovals] = useState([]);
  // Requests the user chose to leave for later: not shown again by a refresh.
  const snoozed = useRef(new Set());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await getLoginApprovals();
      setApprovals(res.data?.approvals || []);
    } catch {
      // Not worth interrupting anything: the next trigger asks again.
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !userId) {
      setApprovals([]);
      snoozed.current = new Set();
      return undefined;
    }

    refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    let channel = null;
    try {
      channel = getEcho()?.private(`App.Models.User.${userId}`);
      channel?.listen(".login.approval", refresh);
    } catch (error) {
      console.warn("[LoginApproval] realtime listener failed:", error);
    }

    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      try {
        channel?.stopListening(".login.approval");
      } catch {}
    };
  }, [loggedIn, userId, refresh]);

  const waiting = approvals.filter((item) => !snoozed.current.has(item.id));
  const current = waiting[0];

  const answer = async (approve, number) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await respondLoginApproval(current.id, { approve, number });
      (approve ? message.success : message.info)(
        res.data?.message || (approve ? "Đã cho phép đăng nhập." : "Đã từ chối yêu cầu đăng nhập.")
      );
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const later = () => {
    if (!current) return;
    snoozed.current.add(current.id);
    // New array, so the list above is filtered again.
    setApprovals((list) => [...list]);
  };

  if (!current) return null;

  const device = [
    current.device_name,
    current.device_model,
    PLATFORM_LABELS[current.platform],
  ]
    .filter(Boolean)
    .join(" · ");

  const rows = [
    ["Thiết bị", device || "Thiết bị không xác định"],
    current.ip && ["Địa chỉ IP", current.ip],
    ["Thời gian", dayjs(current.created_at).format("HH:mm DD/MM/YYYY")],
  ].filter(Boolean);

  return (
    <Modal open centered footer={null} onCancel={later} maskClosable={false} width={420}>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-600">
          <ShieldCheck className="h-6 w-6 text-primary-500 dark:text-[#6bcf60]" />
        </span>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          Yêu cầu đăng nhập mới
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Có thiết bị đang đăng nhập vào tài khoản của bạn. Nếu là bạn, hãy
          chọn số đang hiện trên thiết bị đó.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 dark:border-neutral-600 dark:bg-neutral-800">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={`py-2.5 ${
              index < rows.length - 1 ? "border-b border-gray-200 dark:border-neutral-600" : ""
            }`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {(current.numbers || []).map((number) => (
          <button
            key={number}
            type="button"
            disabled={busy}
            onClick={() => answer(true, number)}
            className="rounded-2xl border-2 border-primary-500 py-3 text-2xl font-extrabold text-primary-500 transition-colors hover:bg-primary-500 hover:text-white disabled:opacity-50 dark:border-[#6bcf60] dark:text-[#6bcf60] dark:hover:bg-[#6bcf60] dark:hover:text-neutral-900"
          >
            {number}
          </button>
        ))}
      </div>

      <Button danger type="primary" block className="mt-4" loading={busy} onClick={() => answer(false)}>
        Không phải tôi - từ chối
      </Button>
      <Button type="text" block className="mt-1" disabled={busy} onClick={later}>
        Để sau
      </Button>

      {waiting.length > 1 && (
        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
          Còn {waiting.length - 1} yêu cầu khác
        </p>
      )}
    </Modal>
  );
}
