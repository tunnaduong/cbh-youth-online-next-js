"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Input, Button } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { ADMIN_SESSION_KEY } from "../AdminShell";

const ADMIN_CREDENTIALS = { username: "admin", password: "anhphatdeptrai" };

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (
        username === ADMIN_CREDENTIALS.username &&
        password === ADMIN_CREDENTIALS.password
      ) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
        router.replace("/admin");
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
        setLoading(false);
      }
    }, 400);
  };

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
