"use client";

import { useEffect, useRef, useState } from "react";
import { Checkbox, Spin } from "antd";
import { XCircle } from "lucide-react";
import { startLoginApproval, getLoginApprovalStatus } from "@/app/Api";
import { getTwoFactorDeviceToken } from "@/utils/twoFactorDevice";

/**
 * Second step of a login when the account approves logins on a device that
 * is already logged in (two-factor method "device"): this browser shows a
 * two-digit number and waits; the user picks that number on the other
 * device, and the login goes through.
 *
 * Props:
 *   challenge       - the API's challenge ({ challenge_token, ... })
 *   rememberDevice / onRememberChange - "remember this device" checkbox
 *   onApproved(data)  - the API's login payload, once approved
 *   onExpired(message) - the challenge itself is gone: back to the login form
 */
export default function DeviceApprovalStep({
  challenge,
  rememberDevice,
  onRememberChange,
  onApproved,
  onExpired,
}) {
  // { status: "starting" | "pending" | "denied" | "expired" | "error", number, message }
  const [approval, setApproval] = useState({ status: "starting" });
  const rememberRef = useRef(rememberDevice);
  rememberRef.current = rememberDevice;
  const handlers = useRef({ onApproved, onExpired });
  handlers.current = { onApproved, onExpired };

  const start = async () => {
    setApproval({ status: "starting" });
    try {
      const res = await startLoginApproval({ challenge_token: challenge.challenge_token });
      setApproval({ status: "pending", number: res.data.number });
    } catch (error) {
      const data = error.response?.data;
      if (data?.challenge_expired) {
        handlers.current.onExpired(data.message);
      } else {
        setApproval({ status: "error", message: data?.message || error.message });
      }
    }
  };

  // Ask as soon as the step is shown.
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.challenge_token]);

  // Wait for the answer from the other device.
  useEffect(() => {
    if (approval.status !== "pending") return undefined;
    let stopped = false;

    const timer = setInterval(async () => {
      try {
        const res = await getLoginApprovalStatus({
          challenge_token: challenge.challenge_token,
          remember_device: rememberRef.current,
          device_token: getTwoFactorDeviceToken() || undefined,
        });
        if (stopped) return;

        const data = res.data;
        if (data?.status === "approved" && data.token && data.user) {
          stopped = true;
          clearInterval(timer);
          handlers.current.onApproved(data);
        } else if (data?.status === "denied" || data?.status === "expired") {
          setApproval((current) => ({ ...current, status: data.status }));
        }
      } catch (error) {
        if (stopped) return;
        if (error.response?.data?.challenge_expired) {
          stopped = true;
          clearInterval(timer);
          handlers.current.onExpired(error.response.data.message);
        }
        // Anything else (a network blip): keep waiting, the next poll retries.
      }
    }, 2500);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [approval.status, challenge.challenge_token]);

  const failed = ["denied", "expired", "error"].includes(approval.status);

  return (
    <div className="space-y-4">
      <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center dark:border-neutral-600 dark:bg-neutral-800">
        {approval.status === "pending" && (
          <>
            <span className="text-5xl font-extrabold tracking-widest text-primary-500 dark:text-[#6bcf60]">
              {approval.number}
            </span>
            <span className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
              <Spin size="small" /> Đang chờ xác nhận...
            </span>
          </>
        )}
        {approval.status === "starting" && <Spin />}
        {failed && (
          <>
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="mt-2 text-sm text-gray-700 dark:text-neutral-200">
              {approval.status === "denied"
                ? "Yêu cầu đăng nhập đã bị từ chối."
                : approval.status === "expired"
                  ? "Yêu cầu đã hết hạn."
                  : approval.message}
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-2 text-sm text-primary-500 hover:underline"
            >
              Gửi lại yêu cầu
            </button>
          </>
        )}
      </div>
      <Checkbox
        checked={rememberDevice}
        onChange={(e) => onRememberChange(e.target.checked)}
        className="dark:text-neutral-200"
      >
        Ghi nhớ thiết bị này trong 60 ngày
      </Checkbox>
    </div>
  );
}
