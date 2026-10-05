"use client";

import { useEffect, useState } from "react";
import { Button, Input, QRCode, Switch, message } from "antd";
import {
  getTwoFactorStatus,
  setupTwoFactorTotp,
  setupTwoFactorEmail,
  setupTwoFactorDevice,
  sendTwoFactorEmailCode,
  confirmTwoFactor,
  disableTwoFactor,
  regenerateTwoFactorRecoveryCodes,
  forgetTwoFactorTrustedDevices,
  setTwoFactorSocialLogin,
} from "@/app/Api";

// Every method can be on at the same time; at login the user picks one.
const METHODS = [
  {
    id: "email",
    label: "Mã gửi qua email",
    hint: "Nhận mã 6 số qua email mỗi lần đăng nhập trên thiết bị mới.",
  },
  {
    id: "totp",
    label: "Ứng dụng xác thực",
    hint: "Lấy mã từ Google Authenticator, Microsoft Authenticator...",
  },
  {
    id: "device",
    label: "Xác nhận trên thiết bị đã đăng nhập",
    hint: "Khi đăng nhập ở thiết bị mới, bạn chọn đúng số trên một thiết bị đang đăng nhập. Cần ít nhất một thiết bị khác đang đăng nhập; hãy giữ mã khôi phục.",
  },
];

const RECOVERY_FILE_NAME = "cbh-youth-online-recovery-codes.txt";

const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Có lỗi xảy ra.";

/**
 * Two-factor authentication section of the account settings: one switch per
 * method (email code, authenticator app), recovery codes and remembered
 * devices.
 */
export default function TwoFactorSettings() {
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(false);
  // The step in progress, if any:
  //   { type: "setup" | "confirm" | "disable", method }
  //   { type: "recovery" } | { type: "regenerate" }
  const [flow, setFlow] = useState(null);
  const [setup, setSetup] = useState(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [forgettingDevices, setForgettingDevices] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTwoFactorStatus()
      .then((res) => {
        if (!cancelled) setStatus(res.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enabledMethods = status?.methods || [];
  const isOn = (method) => enabledMethods.includes(method);

  const reset = () => {
    setFlow(null);
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
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const startSetup = (method) =>
    run(async () => {
      // Approving on a logged-in device has no code to confirm: the password
      // was the proof, so it is on as soon as the API answers.
      if (method === "device") {
        const res = await setupTwoFactorDevice({ password });
        setStatus(res.data.status);
        setPassword("");
        if (res.data.recovery_codes?.length) {
          setRecoveryCodes(res.data.recovery_codes);
          setFlow({ type: "recovery" });
        } else {
          reset();
          message.success(res.data.message || "Đã bật phương thức xác thực.");
        }
        return;
      }

      const request = method === "totp" ? setupTwoFactorTotp : setupTwoFactorEmail;
      const res = await request({ password });
      setSetup(res.data);
      setPassword("");
      setCode("");
      setFlow({ type: "confirm", method });
    });

  const confirmSetup = () => {
    // Enter in the empty code box would otherwise send an empty code.
    if (!code.trim() || busy) return;

    return run(async () => {
      const res = await confirmTwoFactor({ method: flow.method, code: code.trim() });
      setStatus(res.data.status);
      setSetup(null);
      setCode("");

      // Recovery codes only come with the first method; adding another one
      // keeps the codes the user already has.
      if (res.data.recovery_codes?.length) {
        setRecoveryCodes(res.data.recovery_codes);
        setFlow({ type: "recovery" });
      } else {
        reset();
        message.success(res.data.message || "Đã bật phương thức xác thực.");
      }
    });
  };

  // Drop the half-finished setup on the server too (nothing was enforced
  // yet). Awaited, with the controls locked meanwhile: if the user started a
  // new setup straight away, this request could land after it and wipe it.
  const cancelSetup = async (method) => {
    setBusy(true);
    try {
      await disableTwoFactor({ method });
    } catch {
      // A leftover unconfirmed setup is harmless and is replaced by the next one.
    } finally {
      setBusy(false);
    }
    reset();
  };

  // Turning a method off and replacing recovery codes both need the
  // password, or a current code for accounts without a usable password.
  const identityParams = () =>
    status.password_required ? { password } : { code: code.trim() };

  // The confirm button stays off until its field has something in it, so an
  // empty submit can't come back as a "wrong password" error.
  const identityFilled = status?.password_required ? !!password : !!code.trim();

  const confirmDisable = () =>
    run(async () => {
      const res = await disableTwoFactor({ method: flow.method, ...identityParams() });
      setStatus(res.data.status);
      reset();
      message.success(res.data.message || "Đã tắt phương thức xác thực.");
    });

  const confirmRegenerate = () =>
    run(async () => {
      const res = await regenerateTwoFactorRecoveryCodes(identityParams());
      setRecoveryCodes(res.data.recovery_codes || []);
      setStatus(res.data.status);
      setPassword("");
      setCode("");
      setFlow({ type: "recovery" });
    });

  const submitIdentity = () => {
    if (!identityFilled || busy) return;
    return flow.type === "disable" ? confirmDisable() : confirmRegenerate();
  };

  // sendingCode / forgettingDevices keep a double click from firing the
  // request twice (the second "send code" would only hit the resend cooldown
  // and show an error right after the success message).
  const sendEmailCode = async () => {
    if (sendingCode) return;
    setSendingCode(true);
    try {
      const res = await sendTwoFactorEmailCode();
      message.success(res.data?.message || "Đã gửi mã xác thực.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSendingCode(false);
    }
  };

  // Whether Google/Facebook/Apple logins skip the second step. The switch
  // flips at once and goes back if the API refuses.
  const [savingSocial, setSavingSocial] = useState(false);
  const toggleSocialLogin = async (skip) => {
    if (savingSocial) return;
    setSavingSocial(true);
    const before = status;
    setStatus({ ...status, skip_social_login: skip });
    try {
      const res = await setTwoFactorSocialLogin(skip);
      setStatus(res.data.status);
      message.success(res.data.message);
    } catch (err) {
      setStatus(before);
      message.error(errorMessage(err));
    } finally {
      setSavingSocial(false);
    }
  };

  const forgetDevices = async () => {
    if (forgettingDevices) return;
    setForgettingDevices(true);
    try {
      const res = await forgetTwoFactorTrustedDevices();
      setStatus(res.data.status);
      message.success(res.data.message || "Đã xóa các thiết bị tin cậy.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setForgettingDevices(false);
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      message.success("Đã sao chép mã khôi phục.");
    } catch {
      message.error("Không thể sao chép. Hãy tải tệp hoặc chép tay các mã này.");
    }
  };

  const downloadRecoveryCodes = () => {
    const text = [
      "Mã khôi phục CBH Youth Online",
      `Tạo lúc: ${new Date().toLocaleString("vi-VN")}`,
      "Mỗi mã chỉ dùng được một lần. Hãy cất tệp này ở nơi an toàn.",
      "",
      ...recoveryCodes,
      "",
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = RECOVERY_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // A switch shows where the user is heading with that method, not just
  // what is saved, and clicking it back cancels the step in progress.
  const switchChecked = (method) => {
    if (flow?.method === method) return flow.type !== "disable";
    return isOn(method);
  };

  const onToggle = (method) => {
    if (busy) return;

    if (flow?.method === method) {
      if (flow.type === "confirm") {
        cancelSetup(method);
      } else {
        reset();
      }
      return;
    }

    setError("");
    setPassword("");
    setCode("");

    if (isOn(method)) {
      setFlow({ type: "disable", method });
    } else if (status.password_required) {
      setFlow({ type: "setup", method });
    } else {
      // Nothing to ask first: go straight to the code step. If that fails
      // (e.g. the resend cooldown) the switch goes back off, with the error
      // left on screen.
      setFlow({ type: "setup", method });
      startSetup(method).then((started) => {
        if (!started) setFlow(null);
      });
    }
  };

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const hintClass = "text-sm text-gray-500 dark:text-gray-400";
  const linkClass =
    "mt-2 text-sm text-green-600 hover:underline disabled:opacity-50";

  const flowMethod = METHODS.find((item) => item.id === flow?.method);

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
            onPressEnter={submitIdentity}
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
            onPressEnter={submitIdentity}
          />
          {isOn("email") && (
            <button
              type="button"
              onClick={sendEmailCode}
              disabled={sendingCode}
              className={linkClass}
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
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        Xác thực hai lớp
      </h3>
      <p className={hintClass}>
        Khi bật, đăng nhập trên thiết bị mới cần thêm một mã xác thực ngoài
        mật khẩu. Bạn có thể bật nhiều phương thức cùng lúc và chọn một
        phương thức khi đăng nhập.
      </p>

      {!status && <p className={`${hintClass} mt-4`}>Đang tải...</p>}

      {status && (
        <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
          {METHODS.map((method) => {
            const needsVerifiedEmail =
              method.id === "email" && !status.email_verified && !isOn("email");
            // One step at a time: the other switch waits until this one is done.
            const blocked = flow !== null && flow.method !== method.id;

            return (
              <div
                key={method.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {method.label}
                    {method.id === "email" && status.email
                      ? ` (${status.email})`
                      : ""}
                  </h4>
                  <p className={hintClass}>
                    {needsVerifiedEmail
                      ? "Cần xác minh địa chỉ email trước khi bật."
                      : method.hint}
                  </p>
                </div>
                <Switch
                  checked={switchChecked(method.id)}
                  loading={busy && flow?.method === method.id}
                  disabled={busy || blocked || needsVerifiedEmail}
                  onChange={() => onToggle(method.id)}
                  className="ml-4 flex-shrink-0"
                />
              </div>
            );
          })}
        </div>
      )}

      {flow?.type === "setup" && status?.password_required && (
        <div className="mt-4 space-y-4">
          <p className={hintClass}>
            Nhập mật khẩu để bật “{flowMethod?.label}”.
          </p>
          <div className="max-w-sm">
            <label className={labelClass}>Mật khẩu hiện tại</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu để tiếp tục"
              autoComplete="current-password"
              onPressEnter={() => password && !busy && startSetup(flow.method)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              loading={busy}
              disabled={!password}
              onClick={() => startSetup(flow.method)}
            >
              Tiếp tục
            </Button>
            <Button onClick={reset} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {flow?.type === "confirm" && setup && (
        <div className="mt-4 space-y-4">
          {flow.method === "totp" ? (
            <>
              <p className={hintClass}>
                Quét mã QR bằng ứng dụng xác thực, hoặc nhập khóa bên dưới
                vào ứng dụng, rồi nhập mã 6 số ứng dụng hiển thị.
              </p>
              {/* Fixed black-on-white: in dark mode antd draws the code in the
                  light text colour, which is invisible on this white tile and
                  can't be scanned anyway. */}
              <QRCode
                value={setup.otpauth_url}
                size={180}
                bordered={false}
                color="#000000"
                bgColor="#ffffff"
                className="bg-white p-2"
              />
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
            {flow.method === "email" && (
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={sendingCode}
                className={linkClass}
              >
                Gửi lại mã
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              loading={busy}
              onClick={confirmSetup}
              disabled={!code.trim()}
            >
              Bật phương thức này
            </Button>
            <Button onClick={() => cancelSetup(flow.method)} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {flow?.type === "recovery" && (
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyRecoveryCodes}>Sao chép</Button>
            <Button onClick={downloadRecoveryCodes}>Tải tệp .txt</Button>
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

      {(flow?.type === "disable" || flow?.type === "regenerate") && (
        <div className="mt-4 space-y-4">
          <p className={hintClass}>
            {flow.type === "regenerate"
              ? "Xác nhận để tạo bộ mã khôi phục mới. Các mã cũ sẽ không còn dùng được."
              : enabledMethods.length > 1
                ? `Xác nhận để tắt “${flowMethod?.label}”. Phương thức còn lại vẫn được giữ.`
                : `Xác nhận để tắt “${flowMethod?.label}”. Đây là phương thức cuối cùng, nên tài khoản sẽ chỉ còn được bảo vệ bằng mật khẩu.`}
          </p>
          {identityFields}
          <div className="flex gap-2">
            <Button
              type="primary"
              danger={flow.type === "disable"}
              loading={busy}
              disabled={!identityFilled}
              onClick={submitIdentity}
            >
              {flow.type === "disable" ? "Tắt phương thức này" : "Tạo mã mới"}
            </Button>
            <Button onClick={reset} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {status?.enabled && flow === null && (
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex flex-wrap items-center gap-3">
            <span>Mã khôi phục còn lại: {status.recovery_codes_remaining}</span>
            <Button size="small" onClick={() => setFlow({ type: "regenerate" })}>
              Tạo mã khôi phục mới
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>Thiết bị đang được ghi nhớ: {status.trusted_devices}</span>
            {status.trusted_devices > 0 && (
              <Button
                size="small"
                onClick={forgetDevices}
                loading={forgettingDevices}
              >
                Xóa tất cả thiết bị tin cậy
              </Button>
            )}
          </div>
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">
                Bỏ qua xác thực hai lớp khi đăng nhập bằng Google, Facebook, Apple
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bật: đăng nhập qua các dịch vụ này vào thẳng tài khoản. Tắt: vẫn
                phải nhập mã như khi đăng nhập bằng mật khẩu.
              </p>
            </div>
            <Switch
              checked={status.skip_social_login !== false}
              onChange={toggleSocialLogin}
              loading={savingSocial}
              aria-label="Bỏ qua xác thực hai lớp khi đăng nhập bằng Google, Facebook, Apple"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
