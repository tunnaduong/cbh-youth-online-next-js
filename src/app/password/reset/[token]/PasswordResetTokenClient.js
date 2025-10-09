"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import CustomColorButton from "@/components/ui/CustomColorButton";
import InputError from "@/components/ui/InputError";
import { Input } from "antd";
import {
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { forgotPasswordVerify } from "@/app/Api";
import { useSearchParams } from "next/navigation";

export default function PasswordResetTokenClient({ token }) {
  const [data, setData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    // Password validation
    if (data.password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự trở lên.");
      setProcessing(false);
      return;
    }

    if (data.password !== data.password_confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      setProcessing(false);
      return;
    }

    try {
      await forgotPasswordVerify({
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
        email,
      });
      setSuccess(true);
    } catch (err) {
      console.log(err);
      setError(err.response.data.message);
    } finally {
      setProcessing(false);
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
            <form className="space-y-4" onSubmit={submit}>
              <input type="hidden" name="_token" defaultValue="" />
              <div className="space-y-2">
                <Input
                  placeholder="Mật khẩu mới"
                  prefix={<LockOutlined />}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={data.password}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  status={errors.password ? "error" : ""}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </button>
                  }
                />

                <InputError message={errors.password} className="mt-2" />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Xác nhận mật khẩu mới"
                  prefix={<LockOutlined />}
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  value={data.password_confirmation}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      password_confirmation: e.target.value,
                    }))
                  }
                  status={errors.password_confirmation ? "error" : ""}
                  suffix={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </button>
                  }
                />

                <InputError
                  message={errors.password_confirmation}
                  className="mt-2"
                />
              </div>
              {success ? (
                <div className="text-green-500 text-center mb-3">
                  Mật khẩu của bạn đã được thiết lập lại thành công. Bạn có thể
                  đăng nhập với mật khẩu mới ngay bây giờ.
                </div>
              ) : error ? (
                <div className="text-red-500 text-center mb-3">{error}</div>
              ) : null}
              <CustomColorButton
                bgColor={"#319527"}
                block
                className="text-white font-semibold py-[17px] mb-1.5 rounded"
                loading={processing}
                htmlType="submit"
              >
                Thiết lập lại mật khẩu
              </CustomColorButton>
              <div className="flex justify-center text-sm">
                <Link
                  className="text-primary-500 hover:text-primary-500 hover:underline"
                  href="/login"
                >
                  Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
