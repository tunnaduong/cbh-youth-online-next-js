"use client";

import React, { useState } from "react";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { loggedIn } = useAuthContext();

  React.useEffect(() => {
    if (loggedIn) {
      router.push("/");
    }
  }, [loggedIn, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Vui lòng nhập địa chỉ email chính xác.");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      setSuccess(true);
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Quên mật khẩu
          </CardTitle>
          <CardDescription className="text-center">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết
            để thiết lập lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success ? (
            <Alert variant="success" className="mb-4">
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>
                Nếu có tài khoản cho {email}, bạn sẽ nhận được email thiết lập
                lại mật khẩu trong thời gian ngắn.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi link reset mật khẩu...
                    </>
                  ) : (
                    "Gửi link reset mật khẩu"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-gray-600 mt-2 w-full">
            Đã nhớ mật khẩu?{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              Quay lại Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
