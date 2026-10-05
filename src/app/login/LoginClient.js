"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import CustomColorButton from "@/components/ui/CustomColorButton";
import DeviceApprovalStep from "@/components/auth/DeviceApprovalStep";
import InputError from "@/components/ui/InputError";
import { Checkbox, Input, message } from "antd";
import { KeyOutlined, LockOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/contexts/Support";
import {
  loginRequest,
  resendTwoFactorLoginCode,
  verifyTwoFactorLogin,
  getPasskeyLoginOptions,
  loginWithPasskey,
} from "../Api";
import {
  getPasskey,
  passkeyErrorMessage,
  passkeysSupported,
  prepareLoginOptions,
} from "@/utils/webauthn";
import { activateSavedAccount, getSavedAccounts } from "@/utils/savedAccounts";
import {
  getTwoFactorDeviceToken,
  setTwoFactorDeviceToken,
  takeTwoFactorChallengeCookie,
} from "@/utils/twoFactorDevice";

function LoginClientInner() {
  const { setCurrentUser, setUserToken, loggedIn } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const manualRedirectRef = useRef(false);
  // Passkey login options fetched ahead of the tap (see prepareLoginOptions).
  const passkeyOptionsRef = useRef(null);
  useEffect(() => {
    if (!passkeysSupported()) return;
    passkeyOptionsRef.current = prepareLoginOptions(() =>
      getPasskeyLoginOptions().then((res) => res.data)
    );
  }, []);

  // Replace useForm with React state
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Two-factor: set once the password (or Google/Facebook) step passed and
  // the API asked for a code before it will issue a token.
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [resending, setResending] = useState(false);
  // Which method the code is for (an account can have several on), and
  // whether an email code has gone out yet - the API only sends one up front
  // when email is the method it offers first.
  const [challengeMethod, setChallengeMethod] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  // Method "device" (approve on a logged-in device) has no code; this
  // switches its step to typing a recovery code instead.
  const [useRecovery, setUseRecovery] = useState(false);

  const openChallenge = (data) => {
    setChallenge(data);
    setChallengeMethod(data.method);
    setEmailSent(data.method === "email" && data.email_sent !== false);
    setCode("");
  };

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  // A Google/Facebook login that needs two-factor comes back here with the
  // pending challenge in a short-lived cookie (set by the OAuth callback).
  useEffect(() => {
    const pending = takeTwoFactorChallengeCookie();
    if (pending) openChallenge(pending);
  }, []);

  const getRedirectUrl = () => {
    const returnUrl = searchParams.get("continue");
    return returnUrl && returnUrl.trim() !== ""
      ? decodeURIComponent(returnUrl)
      : "/";
  };

  const leaveChallenge = () => {
    setChallenge(null);
    setUseRecovery(false);
    setCode("");
    setErrors({});
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setProcessing(true);
    setErrors({});
    setError(null);
    manualRedirectRef.current = false;

    try {
      const response = await verifyTwoFactorLogin({
        challenge_token: challenge.challenge_token,
        code: code.trim(),
        method: challengeMethod && challengeMethod !== "device" ? challengeMethod : undefined,
        remember_device: rememberDevice,
        device_token: getTwoFactorDeviceToken() || undefined,
      });

      if (!response.data?.user || !response.data?.token) {
        throw new Error("Phản hồi không hợp lệ!");
      }

      if (response.data.device_token) {
        setTwoFactorDeviceToken(response.data.device_token);
      }
      if (typeof response.data.recovery_codes_remaining === "number") {
        message.warning(
          `Bạn vừa dùng một mã khôi phục. Còn lại ${response.data.recovery_codes_remaining} mã - hãy tạo mã mới trong Cài đặt nếu sắp hết.`,
          8
        );
      }

      setCurrentUser(response.data.user);
      setUserToken(response.data.token);
      manualRedirectRef.current = true;
      setProcessing(false);
      router.replace(getRedirectUrl());
    } catch (error) {
      setProcessing(false);

      const data = error.response?.data;
      if (data?.challenge_expired) {
        // Expired or out of attempts: back to the password step.
        leaveChallenge();
        setError(data.message);
      } else if (data?.errors) {
        setErrors(data.errors);
      } else {
        setError(data?.message || error.message);
      }
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError(null);
    try {
      const response = await resendTwoFactorLoginCode({
        challenge_token: challenge.challenge_token,
      });
      setEmailSent(true);
      message.success(response.data?.message || "Đã gửi lại mã xác thực.");
    } catch (error) {
      const data = error.response?.data;
      if (data?.challenge_expired) {
        leaveChallenge();
      }
      setError(data?.message || error.message);
    } finally {
      setResending(false);
    }
  };

  // Every method the account has on; older API responses only name one.
  const challengeMethods = challenge?.methods?.length
    ? challenge.methods
    : challenge
      ? [challenge.method]
      : [];

  // Approved on another device: same ending as a typed code.
  const finishApprovedLogin = (data) => {
    if (data.device_token) setTwoFactorDeviceToken(data.device_token);
    setCurrentUser(data.user);
    setUserToken(data.token);
    manualRedirectRef.current = true;
    router.replace(getRedirectUrl());
  };

  const deviceStep = challengeMethod === "device" && !useRecovery;

  const chooseMethod = (method) => {
    if (method === challengeMethod || processing) return;
    setChallengeMethod(method);
    setUseRecovery(false);
    setCode("");
    setErrors({});
    setError(null);
    // First time email is picked: nothing was sent yet, so send it now.
    if (method === "email" && !emailSent && !resending) resendCode();
  };

  // Passkey: the device's fingerprint/face/PIN is the whole login - nothing
  // to type, and no two-factor step afterwards.
  const handlePasskeyLogin = async () => {
    if (processing) return;
    if (!passkeysSupported()) {
      setError("Trình duyệt này không hỗ trợ passkey.");
      return;
    }

    setProcessing(true);
    setErrors({});
    setError(null);
    manualRedirectRef.current = false;

    try {
      const options = passkeyOptionsRef.current
        ? await passkeyOptionsRef.current.take()
        : (await getPasskeyLoginOptions()).data;
      const credential = await getPasskey(options.publicKey);
      const response = await loginWithPasskey({
        request_id: options.request_id,
        credential,
      });

      if (!response.data?.user || !response.data?.token) {
        throw new Error("Phản hồi không hợp lệ!");
      }

      setCurrentUser(response.data.user);
      setUserToken(response.data.token);
      manualRedirectRef.current = true;
      setProcessing(false);
      router.replace(getRedirectUrl());
    } catch (error) {
      setProcessing(false);
      // Includes "no passkey on this device", which the browser reports the
      // same way as a closed prompt - so it gets a hint, not silence.
      setError(passkeyErrorMessage(error, "login"));
    }
  };

  // Check if user is already logged in
  // Skip redirect if we're processing or if we manually handled redirect
  useEffect(() => {
    if (loggedIn && !processing && !manualRedirectRef.current) {
      // Check for continue parameter and redirect to it, otherwise go home
      const returnUrl = searchParams.get("continue");
      const redirectUrl =
        returnUrl && returnUrl.trim() !== ""
          ? decodeURIComponent(returnUrl)
          : "/";
      router.push(redirectUrl);
    }
  }, [loggedIn, router, processing, searchParams]);

  // Reset password on unmount
  useEffect(() => {
    return () => {
      setData((prev) => ({ ...prev, password: "" }));
    };
  }, []);

  // Read OAuth provider error from cookie (set by callback), then clear it
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )oauth_error=([^;]*)/);
      const msg = match ? decodeURIComponent(match[1]) : "";
      if (msg) {
        setError(msg);
        // clear cookie
        document.cookie =
          "oauth_error=; Max-Age=0; path=/; SameSite=Lax;" +
          (location.protocol === "https:" ? " Secure;" : "");
      }

      const dbgMatch = document.cookie.match(/(?:^|; )oauth_debug=([^;]*)/);
      const dbgRaw = dbgMatch ? decodeURIComponent(dbgMatch[1]) : "";
      if (dbgRaw) {
        try {
          // decode base64url -> base64
          const b64 = dbgRaw.replace(/-/g, "+").replace(/_/g, "/");
          const json = atob(b64);
          const parsed = JSON.parse(json);
          // eslint-disable-next-line no-console
          console.error("OAuth debug:", parsed);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("OAuth debug (raw):", dbgRaw);
        }
        // clear cookie
        document.cookie =
          "oauth_debug=; Max-Age=0; path=/; SameSite=Lax;" +
          (location.protocol === "https:" ? " Secure;" : "");
      }
    } catch {}
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    manualRedirectRef.current = false; // Reset ref for new login attempt

    try {
      // Get continue from current URL parameters
      const returnUrl = searchParams.get("continue");

      // Make login request
      const response = await loginRequest({
        username: data.email, // Using email as username for API
        password: data.password,
        // Lets a device the user chose to remember skip the two-factor step
        device_token: getTwoFactorDeviceToken() || undefined,
      });

      if (response.data?.two_factor_required) {
        setError(null);
        openChallenge(response.data);
        setProcessing(false);
        return;
      }

      if (response.data && response.data.user && response.data.token) {
        setCurrentUser(response.data.user);
        setUserToken(response.data.token);

        // Redirect to return URL or home
        // Check if returnUrl exists and is not empty string
        const redirectUrl =
          returnUrl && returnUrl.trim() !== ""
            ? decodeURIComponent(returnUrl)
            : "/";

        // Mark that we're handling redirect manually to prevent useEffect from running
        manualRedirectRef.current = true;
        setProcessing(false);

        // Use replace to override any automatic redirects
        router.replace(redirectUrl);
      } else {
        setProcessing(false);
        throw new Error("Phản hồi không hợp lệ!");
      }
    } catch (error) {
      setProcessing(false);

      const data = error.response?.data;
      if (data?.banned) {
        setError(data.message);
      } else if (data?.errors) {
        setErrors(data.errors);
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center auth-background bg-[#eaf3ef] dark:bg-neutral-800 px-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow w-full bg-white dark:!bg-neutral-700 dark:!border-neutral-500 max-w-md">
          <div className="flex flex-col p-6 -mb-5 space-y-4 text-center">
            <div className="flex justify-center">
              <Link className="flex gap-x-1 items-center" href="/">
                <Image
                  alt="CYO's Logo"
                  width={50}
                  height={50}
                  src="/images/logo.png"
                />
                <div className="text-[18px] text-left font-light text-[#319527] leading-5">
                  <h1 className="font-light">Diễn đàn học sinh</h1>
                  <h1 className="font-bold">Chuyên Biên Hòa</h1>
                </div>
              </Link>
            </div>
          </div>
          {challenge ? (
            <div className="p-6 pt-0 mt-6">
              <h2 className="text-base font-semibold text-center dark:text-neutral-100">
                Xác thực hai lớp
              </h2>
              {challengeMethods.length > 1 && (
                <div className="mt-3 flex rounded-md border border-gray-200 p-0.5 text-sm dark:border-neutral-500">
                  {challengeMethods.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => chooseMethod(item)}
                      disabled={processing}
                      className={`flex-1 rounded px-2 py-1.5 transition-colors ${
                        item === challengeMethod
                          ? "bg-[#319527] font-medium text-white"
                          : "text-gray-600 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-600"
                      }`}
                    >
                      {item === "email"
                        ? "Mã qua email"
                        : item === "device"
                          ? "Thiết bị khác"
                          : "Ứng dụng xác thực"}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 mb-4 text-sm text-center text-gray-500 dark:text-neutral-400">
                {deviceStep
                  ? "Mở CBH Youth Online trên một thiết bị đang đăng nhập và chọn số dưới đây để cho phép đăng nhập."
                  : challengeMethod === "device"
                    ? "Nhập một mã khôi phục của bạn."
                    : challengeMethod === "email"
                  ? emailSent
                    ? `Nhập mã 6 số được gửi tới ${challenge.email || "email của bạn"}.`
                    : `Bấm "Gửi lại mã" để nhận mã 6 số qua ${challenge.email || "email của bạn"}.`
                  : "Nhập mã 6 số từ ứng dụng xác thực của bạn."}
              </p>
              {deviceStep ? (
                <div className="space-y-4">
                  <DeviceApprovalStep
                    challenge={challenge}
                    rememberDevice={rememberDevice}
                    onRememberChange={setRememberDevice}
                    onApproved={finishApprovedLogin}
                    onExpired={(text) => {
                      leaveChallenge();
                      setError(text);
                    }}
                  />
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        leaveChallenge();
                        setError(null);
                      }}
                      className="text-primary-500 hover:underline"
                    >
                      Quay lại đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseRecovery(true)}
                      className="text-primary-500 hover:underline"
                    >
                      Dùng mã khôi phục
                    </button>
                  </div>
                </div>
              ) : (
              <form className="space-y-4" onSubmit={submitCode}>
                <div className="space-y-2">
                  <Input
                    autoFocus
                    placeholder="Mã xác thực"
                    prefix={<SafetyOutlined />}
                    name="code"
                    autoComplete="one-time-code"
                    maxLength={20}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    status={errors.code ? "error" : ""}
                  />
                  <InputError message={errors.code} className="mt-2" />
                </div>
                <Checkbox
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="dark:text-neutral-200"
                >
                  Ghi nhớ thiết bị này trong 60 ngày
                </Checkbox>
                <CustomColorButton
                  bgColor={"#319527"}
                  block
                  className="text-white font-semibold py-[17px] mb-1.5 rounded"
                  loading={processing}
                  htmlType="submit"
                >
                  Xác nhận
                </CustomColorButton>
                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      leaveChallenge();
                      // Don't carry a wrong-code message over to the login form
                      setError(null);
                    }}
                    disabled={processing}
                    className="text-primary-500 hover:underline disabled:opacity-50"
                  >
                    Quay lại đăng nhập
                  </button>
                  {challengeMethod === "email" && (
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={resending}
                      className="text-primary-500 hover:underline disabled:opacity-50"
                    >
                      {resending ? "Đang gửi..." : "Gửi lại mã"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-neutral-400">
                  Không lấy được mã? Bạn có thể nhập một mã khôi phục vào ô
                  trên.
                </p>
                {challengeMethod === "device" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCode("");
                      setUseRecovery(false);
                    }}
                    className="block w-full text-center text-sm text-primary-500 hover:underline"
                  >
                    Quay lại xác nhận trên thiết bị
                  </button>
                )}
              </form>
              )}
            </div>
          ) : (
          <div className="p-6 pt-0">
            {savedAccounts.length > 0 && !loggedIn && (
              <div className="mb-5 mt-6 space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                  Tiếp tục với tài khoản đã đăng nhập
                </p>
                {savedAccounts.map((account) => (
                  <button
                    key={account.user.id}
                    type="button"
                    onClick={() =>
                      activateSavedAccount(
                        account,
                        decodeURIComponent(searchParams.get("continue") || "/")
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:border-neutral-500 dark:hover:bg-neutral-600"
                  >
                    <img
                      src={
                        account.user.avatar_url ||
                        `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${account.user.username}/avatar`
                      }
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium dark:text-neutral-100">
                        {account.user.profile_name || account.user.username}
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-neutral-400">
                        @{account.user.username}
                      </span>
                    </span>
                  </button>
                ))}
                <div className="flex items-center gap-3 pt-3 text-xs text-gray-400">
                  <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-500" />
                  hoặc đăng nhập tài khoản khác
                  <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-500" />
                </div>
              </div>
            )}
            {/* if error then show */}
            <form className="space-y-4" onSubmit={submit}>
              <input type="hidden" name="_token" defaultValue="" />
              <div className="space-y-2">
                <Input
                  placeholder="Tên người dùng hoặc email"
                  prefix={<UserOutlined />}
                  name="email"
                  value={data.email}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  status={errors.username ? "error" : ""}
                />

                <InputError message={errors.username} className="mt-2" />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  prefix={<LockOutlined />}
                  name="password"
                  value={data.password}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  status={errors.password ? "error" : ""}
                />

                <InputError message={errors.password} className="mt-2" />
              </div>
              <CustomColorButton
                bgColor={"#319527"}
                block
                className="text-white font-semibold py-[17px] mb-1.5 rounded"
                loading={processing}
                htmlType="submit"
              >
                Đăng nhập
              </CustomColorButton>
              <div className="flex justify-between text-sm">
                <Link
                  className="text-primary-500 hover:text-primary-500 hover:underline"
                  href="/password/reset"
                >
                  Quên mật khẩu?
                </Link>
                <Link
                  className="text-primary-500 hover:text-primary-500 hover:underline"
                  href={(() => {
                    const continueParam = searchParams.get("continue");
                    const queryString = continueParam 
                      ? `?continue=${encodeURIComponent(continueParam)}` 
                      : "";
                    return `/register${queryString}`;
                  })()}
                >
                  Tạo tài khoản
                </Link>
              </div>
            </form>
          </div>
          )}
          {error && (
            <div className="text-red-500 text-center mb-3 px-6">{error}</div>
          )}
          <div className={challenge ? "hidden" : "flex items-center p-6 pt-0"}>
            <div className="w-full space-y-2">
              <div className="text-center text-gray-500 text-sm mb-2">
                Đăng nhập bằng
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={processing}
                  title="Đăng nhập bằng passkey"
                  className="inline-flex dark:!border-neutral-500 dark:bg-[#2c2c2c] dark:text-neutral-200 items-center justify-center rounded-md text-base transition-colors disabled:pointer-events-none disabled:opacity-50 border border-input shadow-sm hover:bg-[#eeeeee] w-10 h-10"
                >
                  <KeyOutlined />
                  <span className="sr-only">Passkey</span>
                </button>
                <a
                  href={`/login/facebook?continue=${encodeURIComponent(
                    (() => {
                      const continueParam = searchParams.get("continue");
                      return continueParam && continueParam.trim() !== "" ? continueParam : "/";
                    })()
                  )}`}
                  className="inline-flex dark:!border-neutral-500 dark:bg-[#2c2c2c] items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-[#eeeeee] hover:text-accent-foreground w-10 h-10"
                >
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth={0}
                    viewBox="0 0 512 512"
                    className="w-5 h-5 text-blue-600"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"
                    ></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </a>
                <a
                  href={`/login/google?continue=${encodeURIComponent(
                    (() => {
                      const continueParam = searchParams.get("continue");
                      return continueParam && continueParam.trim() !== "" ? continueParam : "/";
                    })()
                  )}`}
                  className="inline-flex dark:!border-neutral-500 dark:bg-[#2c2c2c] items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-[#eeeeee] hover:text-accent-foreground w-10 h-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    ></path>
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    ></path>
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                  </svg>
                  <span className="sr-only">Google</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginClientInner />
    </Suspense>
  );
}
