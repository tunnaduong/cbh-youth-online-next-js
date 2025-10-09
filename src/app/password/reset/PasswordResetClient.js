"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import CustomColorButton from "@/components/ui/CustomColorButton";
import InputError from "@/components/ui/InputError";
import { Input, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/contexts/Support";
import { forgotPassword } from "@/app/Api";

export default function PasswordResetClient() {
  const [data, setData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const router = useRouter();
  const { loggedIn } = useAuthContext();

  React.useEffect(() => {
    if (loggedIn) {
      router.push("/");
    }
  }, [loggedIn, router]);

  const submit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setErrors({ email: "Vui lòng nhập địa chỉ email chính xác." });
      setProcessing(false);
      return;
    }

    try {
      await forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
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
          <div className="text-center text-gray-600 dark:text-neutral-300 text-sm my-4">
            Quên mật khẩu? Không sao cả. Chỉ cần cho chúng tôi biết địa chỉ
            email của bạn và chúng tôi sẽ gửi cho bạn một liên kết đặt lại mật
            khẩu để chọn mật khẩu mới.
          </div>
          {success ? (
            <div className="text-green-500 text-center mb-3">
              Nếu có tài khoản cho {submittedEmail}, bạn sẽ nhận được email
              thiết lập lại mật khẩu trong thời gian ngắn.
            </div>
          ) : error ? (
            <div className="text-red-500 text-center mb-3">{error}</div>
          ) : null}
          <form className="space-y-4" onSubmit={submit}>
            <input type="hidden" name="_token" defaultValue="" />
            <div className="space-y-2">
              <Input
                placeholder="Địa chỉ email"
                prefix={<MailOutlined />}
                name="email"
                value={data.email}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, email: e.target.value }))
                }
                status={errors.email ? "error" : ""}
              />

              <InputError message={errors.email} className="mt-2" />
            </div>
            <CustomColorButton
              bgColor={"#319527"}
              block
              className="text-white font-semibold py-[17px] mb-1.5 rounded"
              loading={processing}
              htmlType="submit"
            >
              Gửi liên kết đặt lại mật khẩu
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
  );
}
