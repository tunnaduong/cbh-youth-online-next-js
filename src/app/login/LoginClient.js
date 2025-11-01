"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import CustomColorButton from "@/components/ui/CustomColorButton";
import InputError from "@/components/ui/InputError";
import { Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/contexts/Support";
import { loginRequest } from "../Api";

export default function LoginClient() {
  const { setCurrentUser, setUserToken, loggedIn } = useAuthContext();
  const router = useRouter();
  const manualRedirectRef = useRef(false);

  // Replace useForm with React state
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  // Skip redirect if we're processing or if we manually handled redirect
  useEffect(() => {
    if (loggedIn && !processing && !manualRedirectRef.current) {
      // Check for continue parameter and redirect to it, otherwise go home
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("continue");
      const redirectUrl =
        returnUrl && returnUrl.trim() !== ""
          ? decodeURIComponent(returnUrl)
          : "/";
      router.push(redirectUrl);
    }
  }, [loggedIn, router, processing]);

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
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("continue");

      // Make login request
      const response = await loginRequest({
        username: data.email, // Using email as username for API
        password: data.password,
      });

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

      // Handle backend validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
        console.log("err1", error.response.data.errors);
      } else {
        setError(error.message);
        console.log("err2", error);
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
          <div className="p-6 pt-0">
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
                  href="/register"
                >
                  Tạo tài khoản
                </Link>
              </div>
            </form>
          </div>
          {error && (
            <div className="text-red-500 text-center mb-3">{error}</div>
          )}
          <div className="flex items-center p-6 pt-0">
            <div className="w-full space-y-2">
              <div className="text-center text-gray-500 text-sm mb-2">
                Đăng nhập bằng
              </div>
              <div className="flex justify-center space-x-4">
                <a
                  href={`/login/facebook?continue=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? (() => {
                          const continueParam = new URLSearchParams(
                            window.location.search
                          ).get("continue");
                          return continueParam && continueParam.trim() !== ""
                            ? continueParam
                            : "/";
                        })()
                      : "/"
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
                    typeof window !== "undefined"
                      ? (() => {
                          const continueParam = new URLSearchParams(
                            window.location.search
                          ).get("continue");
                          return continueParam && continueParam.trim() !== ""
                            ? continueParam
                            : "/";
                        })()
                      : "/"
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
