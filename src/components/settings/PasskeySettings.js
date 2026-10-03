"use client";

import { useEffect, useState } from "react";
import { Button, Input, Popconfirm, message } from "antd";
import { KeyRound } from "lucide-react";
import dayjs from "dayjs";
import {
  getPasskeys,
  getPasskeyRegistrationOptions,
  storePasskey,
  deletePasskey,
} from "@/app/Api";
import { createPasskey, isPasskeyCancel, passkeysSupported } from "@/utils/webauthn";

const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Có lỗi xảy ra.";

/**
 * Passkeys section of the account settings. A passkey logs in on its own -
 * no password and no two-factor step - so it is managed apart from 2FA.
 */
export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const apply = (data) => {
    setPasskeys(data.passkeys || []);
    setPasswordRequired(data.password_required !== false);
  };

  useEffect(() => {
    setSupported(passkeysSupported());
    let cancelled = false;
    getPasskeys()
      .then((res) => {
        if (!cancelled) apply(res.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeAdd = () => {
    setAdding(false);
    setPassword("");
    setError("");
  };

  const add = async () => {
    if (busy || (passwordRequired && !password)) return;
    setBusy(true);
    setError("");
    try {
      const options = await getPasskeyRegistrationOptions({ password });
      const credential = await createPasskey(options.data.publicKey);
      const res = await storePasskey({ credential });
      apply(res.data);
      closeAdd();
      message.success(res.data.message || "Đã thêm passkey.");
    } catch (err) {
      // Closing the browser's prompt is not an error worth showing.
      if (!isPasskeyCancel(err)) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startAdd = () => {
    setError("");
    if (passwordRequired) {
      setAdding(true);
    } else {
      // Nothing to ask first (social-login account): go straight to the prompt.
      add();
    }
  };

  const remove = async (id) => {
    setRemovingId(id);
    try {
      const res = await deletePasskey(id);
      apply(res.data);
      message.success(res.data.message || "Đã xóa passkey.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  const hintClass = "text-sm text-gray-500 dark:text-gray-400";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Passkey
          </h3>
          <p className={hintClass}>
            Đăng nhập chỉ bằng vân tay, khuôn mặt hoặc mã khóa màn hình của
            thiết bị - không cần mật khẩu và không cần mã xác thực hai lớp.
          </p>
        </div>
        {supported && passkeys && !adding && (
          <Button onClick={startAdd} loading={busy}>
            Thêm passkey
          </Button>
        )}
      </div>

      {!supported && (
        <p className={`${hintClass} mt-3`}>
          Trình duyệt này không hỗ trợ passkey.
        </p>
      )}

      {loadError && (
        <p className={`${hintClass} mt-3`}>
          Không tải được danh sách passkey. Hãy tải lại trang.
        </p>
      )}

      {adding && (
        <div className="mt-4 space-y-3">
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mật khẩu hiện tại
            </label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu để tiếp tục"
              autoComplete="current-password"
              onPressEnter={add}
            />
          </div>
          <div className="flex gap-2">
            <Button type="primary" loading={busy} disabled={!password} onClick={add}>
              Tạo passkey
            </Button>
            <Button onClick={closeAdd} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {passkeys && passkeys.length === 0 && !adding && (
        <p className={`${hintClass} mt-3`}>Bạn chưa có passkey nào.</p>
      )}

      {passkeys && passkeys.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
          {passkeys.map((passkey) => (
            <li key={passkey.id} className="flex items-center gap-3 py-3">
              <KeyRound className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {passkey.name || "Passkey"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tạo ngày {dayjs(passkey.created_at).format("DD/MM/YYYY")}
                  {passkey.last_used_at
                    ? ` · dùng lần cuối ${dayjs(passkey.last_used_at).format("HH:mm DD/MM/YYYY")}`
                    : " · chưa dùng"}
                </p>
              </div>
              <Popconfirm
                title="Xóa passkey này?"
                description="Thiết bị đó sẽ không còn đăng nhập được bằng passkey này."
                okText="Xóa"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={() => remove(passkey.id)}
              >
                <Button size="small" loading={removingId === passkey.id}>
                  Xóa
                </Button>
              </Popconfirm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
