"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Input, Button } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { ADMIN_SESSION_KEY } from "../AdminShell";
import * as Api from "@/app/Api";
import { setAuthCookie, getAuthCookie } from "@/utils/cookies";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in via cookies
  useEffect(() => {
    const authToken = getAuthCookie();
    if (authToken) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      router.replace("/admin");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await Api.loginRequest({ username, password });
      const user = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!user || !token) {
        setError("Phản hồi từ server không hợp lệ.");
        setLoading(false);
        return;
      }

      // Check if user is admin
      if (user.role !== "admin") {
        setError("Tài khoản của bạn không có quyền truy cập quản trị viên.");
        setLoading(false);
        return;
      }

      // Save token to cookies and session
      setAuthCookie(token);
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      localStorage.setItem("CURRENT_USER", JSON.stringify(user));

      router.replace("/admin");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Tên đăng nhập hoặc mật khẩu không đúng.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eaf3ef] dark:bg-neutral-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#319527]" />
          <p className="text-gray-600 dark:text-gray-300">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eaf3ef] dark:bg-neutral-800 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white dark:bg-neutral-700 dark:border-neutral-500 shadow">
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4">
          <Link href="/">
            <Image src="/images/logo.png" alt="CBH Logo" width={52} height={52} />
          </Link>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Quản trị viên
            </p>
            <h1 className="text-lg font-bold text-[#319527] leading-tight">
              CBH Youth Online
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Tên đăng nhập
            </label>
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              status={error ? "error" : ""}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Mật khẩu
            </label>
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              status={error ? "error" : ""}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ background: "#319527", borderColor: "#319527", marginTop: 4 }}
            className="!font-semibold !py-5"
          >
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}
