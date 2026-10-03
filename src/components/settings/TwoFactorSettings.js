"use client";

import { useEffect, useState } from "react";
import { Button, Input, QRCode, Radio, Switch, message } from "antd";
import {
  getTwoFactorStatus,
  setupTwoFactorTotp,
  setupTwoFactorEmail,
  sendTwoFactorEmailCode,
  confirmTwoFactor,
  disableTwoFactor,
  regenerateTwoFactorRecoveryCodes,
  forgetTwoFactorTrustedDevices,
} from "@/app/Api";

const METHOD_LABELS = {
  email: "Mã gửi qua email",
  totp: "Ứng dụng xác thực",
};

const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Có lỗi xảy ra.";

/**
 * Two-factor authentication section of the account settings: turn it on
 * (email code or authenticator app), turn it off, recovery codes and
 * remembered devices.
 */
export default function TwoFactorSettings() {
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(false);
  // null | "choose" | "confirm" | "recovery" | "disable" | "regenerate"
  const [mode, setMode] = useState(null);
  const [method, setMethod] = useState("email");
  const [setup, setSetup] = useState(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTwoFactorStatus()
      .then((res) => {
        if (cancelled) return;
        setStatus(res.data);
        // Email codes need a verified address to be sent to.
        if (!res.data.email_verified) setMethod("totp");
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    setMode(null);
    setSetup(null);
    setPassword("");
    setCode("");
    setError("");
  };

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      const request = method === "totp" ? setupTwoFactorTotp : setupTwoFactorEmail;
      const res = await request({ password });
      setSetup(res.data);
      setPassword("");
      setCode("");
      setMode("confirm");
    });

  const confirmSetup = () =>
    run(async () => {
      const res = await confirmTwoFactor({ code: code.trim() });
      setRecoveryCodes(res.data.recovery_codes || []);
      setStatus(res.data.status);
      setSetup(null);
      setCode("");
      setMode("recovery");
    });

  const cancelSetup = () => {
    // Drop the half-finished setup on the server too (nothing was enforced yet).
    disableTwoFactor().catch(() => {});
    reset();
  };

  // Turning two-factor off and replacing recovery codes both need the
  // password, or a current code for accounts without a usable password.
  const identityParams = () =>
    status.password_required ? { password } : { code: code.trim() };

  const confirmDisable = () =>
    run(async () => {
      const res = await disableTwoFactor(identityParams());
      setStatus(res.data.status);
      reset();
      message.success(res.data.message || "Đã tắt xác thực hai lớp.");
    });

  const confirmRegenerate = () =>
    run(async () => {
      const res = await regenerateTwoFactorRecoveryCodes(identityParams());
      setRecoveryCodes(res.data.recovery_codes || []);
      setStatus(res.data.status);
      setPassword("");
      setCode("");
      setMode("recovery");
    });

  const sendEmailCode = async () => {
    try {
      const res = await sendTwoFactorEmailCode();
      message.success(res.data?.message || "Đã gửi mã xác thực.");
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const forgetDevices = async () => {
    try {
      const res = await forgetTwoFactorTrustedDevices();
      setStatus(res.data.status);
      message.success(res.data.message || "Đã xóa các thiết bị tin cậy.");
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      message.success("Đã sao chép mã khôi phục.");
    } catch {
      message.error("Không thể sao chép. Hãy chép tay các mã này.");
    }
  };

  const onToggle = (checked) => {
    setError("");
    setPassword("");
    setCode("");
    setMode(checked ? "choose" : "disable");
  };

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const hintClass = "text-sm text-gray-500 dark:text-gray-400";

  const identityFields = (
    <div className="max-w-sm">
      {status?.password_required ? (
        <>
          <label className={labelClass}>Mật khẩu hiện tại</label>
          <Input.Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
          />
        </>
      ) : (
        <>
          <label className={labelClass}>Mã xác thực hoặc mã khôi phục</label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã"
            autoComplete="one-time-code"
            maxLength={20}
          />
          {status?.method === "email" && (
            <button
              type="button"
              onClick={sendEmailCode}
              className="mt-2 text-sm text-green-600 hover:underline"
            >
              Gửi mã tới {status.email || "email của tôi"}
            </button>
          )}
        </>
      )}
    </div>
  );

  if (loadError) {
    return (
      <p className={hintClass}>
        Không tải được cài đặt xác thực hai lớp. Hãy tải lại trang.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Xác thực hai lớp
          </h3>
          <p className={hintClass}>
            Khi bật, đăng nhập trên thiết bị mới cần thêm một mã xác thực
            ngoài mật khẩu.
          </p>
        </div>
        <Switch
          checked={!!status?.enabled}
          loading={!status}
          disabled={!status || mode !== null}
          onChange={onToggle}
          className="ml-4"
        />
      </div>

      {status?.enabled && mode === null && (
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p>
            Đang bật: <strong>{METHOD_LABELS[status.method]}</strong>
            {status.method === "email" && status.email ? ` (${status.email})` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span>Mã khôi phục còn lại: {status.recovery_codes_remaining}</span>
            <Button size="small" onClick={() => setMode("regenerate")}>
              Tạo mã khôi phục mới
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>Thiết bị đang được ghi nhớ: {status.trusted_devices}</span>
            {status.trusted_devices > 0 && (
              <Button size="small" onClick={forgetDevices}>
                Xóa tất cả thiết bị tin cậy
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === "choose" && (
        <div className="mt-4 space-y-4">
          <Radio.Group
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value="email" disabled={!status.email_verified}>
              Mã gửi qua email
              {status.email ? ` (${status.email})` : ""}
              {!status.email_verified && " - cần xác minh email trước"}
            </Radio>
            <Radio value="totp">
              Ứng dụng xác thực (Google Authenticator, Microsoft
              Authenticator...)
            </Radio>
          </Radio.Group>
          {status.password_required && (
            <div className="max-w-sm">
              <label className={labelClass}>Mật khẩu hiện tại</label>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu để tiếp tục"
                autoComplete="current-password"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="primary" loading={busy} onClick={startSetup}>
              Tiếp tục
            </Button>
            <Button onClick={reset} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {mode === "confirm" && setup && (
        <div className="mt-4 space-y-4">
          {setup.method === "totp" ? (
            <>
              <p className={hintClass}>
                Quét mã QR bằng ứng dụng xác thực, hoặc nhập khóa bên dưới
                vào ứng dụng, rồi nhập mã 6 số ứng dụng hiển thị.
              </p>
              <QRCode value={setup.otpauth_url} size={180} bordered={false} className="bg-white p-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                Khóa: <code className="font-mono">{setup.secret}</code>
              </p>
            </>
          ) : (
            <p className={hintClass}>
              Chúng tôi đã gửi mã 6 số tới {setup.email}. Nhập mã để hoàn tất.
            </p>
          )}
          <div className="max-w-sm">
            <label className={labelClass}>Mã xác thực</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 chữ số"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={7}
              onPressEnter={confirmSetup}
            />
            {setup.method === "email" && (
              <button
                type="button"
                onClick={sendEmailCode}
                className="mt-2 text-sm text-green-600 hover:underline"
              >
                Gửi lại mã
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="primary" loading={busy} onClick={confirmSetup} disabled={!code.trim()}>
              Bật xác thực hai lớp
            </Button>
            <Button onClick={cancelSetup} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {mode === "recovery" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Lưu các mã khôi phục này ở nơi an toàn. Mỗi mã dùng được một lần
            để đăng nhập khi bạn không lấy được mã xác thực, và sẽ không
            được hiển thị lại.
          </p>
          <div className="grid max-w-sm grid-cols-2 gap-2 rounded-md bg-gray-50 p-3 font-mono text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
            {recoveryCodes.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyRecoveryCodes}>Sao chép</Button>
            <Button
              type="primary"
              onClick={() => {
                setRecoveryCodes([]);
                reset();
              }}
            >
              Tôi đã lưu
            </Button>
          </div>
        </div>
      )}

      {(mode === "disable" || mode === "regenerate") && (
        <div className="mt-4 space-y-4">
          <p className={hintClass}>
            {mode === "disable"
              ? "Xác nhận để tắt xác thực hai lớp. Tài khoản của bạn sẽ chỉ còn được bảo vệ bằng mật khẩu."
              : "Xác nhận để tạo bộ mã khôi phục mới. Các mã cũ sẽ không còn dùng được."}
          </p>
          {identityFields}
          <div className="flex gap-2">
            <Button
              type="primary"
              danger={mode === "disable"}
              loading={busy}
              onClick={mode === "disable" ? confirmDisable : confirmRegenerate}
            >
              {mode === "disable" ? "Tắt xác thực hai lớp" : "Tạo mã mới"}
            </Button>
            <Button onClick={reset} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
