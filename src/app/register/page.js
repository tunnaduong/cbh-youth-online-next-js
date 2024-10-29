"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { IoLogoFacebook } from "react-icons/io5";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signupRequest } from "../Api";
import { useAuthContext } from "@/contexts/Support";
import { useRouter } from "next/navigation";

export default function RegisterScreen() {
  const router = useRouter();
  const { setCurrentUser, setUserToken, loggedIn } = useAuthContext();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [error, setError] = React.useState({ __html: "" });
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (loggedIn) {
      router.push("/");
    }
  }, [loggedIn, router]);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setError({ __html: "" });
    setIsLoading(true);

    if (password !== passwordConfirm) {
      setError({ __html: "Mật khẩu xác nhận không khớp!" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await signupRequest({ name, email, username, password });

      if (response.data && response.data.user && response.data.token) {
        setCurrentUser(response.data.user);
        setUserToken(response.data.token);
        setIsLoading(false);
        router.push("/");
      } else {
        setIsLoading(false);
        throw new Error("Phản hồi không hợp lệ!");
      }
    } catch (error) {
      setIsLoading(false);
      setError({ __html: error.response.data.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          {error.__html && (
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription
                dangerouslySetInnerHTML={error}
              ></AlertDescription>
            </Alert>
          )}
          <div className="flex gap-x-1 items-center justify-center">
            <Image
              src="/images/logo.png"
              height={120}
              width={120}
              alt="CYO's Logo"
              className="w-12 h-12"
            />
            <div className="text-[18px] text-left font-light text-[#319527] leading-5">
              <h1 className="font-light">Thanh niên</h1>
              <h1 className="font-bold">Chuyên Biên Hòa Online</h1>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action="#"
            method="POST"
            className="space-y-4"
            onSubmit={onSubmit}
          >
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Tên người dùng"
                className="w-full px-3 py-2 border rounded-md"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Họ và tên"
                className="w-full px-3 py-2 border rounded-md"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Địa chỉ Email"
                className="w-full px-3 py-2 border rounded-md"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Mật khẩu"
                className="w-full px-3 py-2 border rounded-md"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                className="w-full px-3 py-2 border rounded-md"
                value={passwordConfirm}
                onChange={(ev) => setPasswordConfirm(ev.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                <>Đăng ký</>
              )}
            </Button>
            <div className="flex justify-between text-sm">
              <Link href="#" className="text-green-600 hover:underline">
                Quên mật khẩu?
              </Link>
              <Link href="/login" className="text-green-600 hover:underline">
                Đã có tài khoản?
              </Link>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <div className="text-center text-sm text-gray-600">
              Đăng ký bằng
            </div>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="icon" className="w-10 h-10">
                <IoLogoFacebook className="w-5 h-5 text-blue-600" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button variant="outline" size="icon" className="w-10 h-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-5 h-5"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                <span className="sr-only">Google</span>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
