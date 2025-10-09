"use client";

import Navbar from "@/components/include/navbar";
import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import { verifyEmail } from "@/app/Api";

const EmailVerifyClient = ({ token }) => {
  const router = useRouter();
  const [error, setError] = React.useState(null);

  const _verifyEmail = async () => {
    try {
      const res = await verifyEmail(token);
      if (res.data.error) {
        setError(true);
      }

      return res;
    } catch (error) {
      console.log("error verifying email", error);

      setError(true);
    }
  };

  React.useEffect(() => {
    _verifyEmail();
  }, []);

  return (
    <div className="mt-[66px]">
      <Navbar selected={null} />
      <div className="flex flex-row">
        <div
          className="flex flex-1 items-center justify-center"
          style={{
            zoom: "1.4",
            display: "block",
            position: "absolute",
            left: "50%",
            top: "50%",
            WebkitTransform: "translate(-50%, -50%)",
            transform: "translate(-50%, -50%)",
          }}
        >
          <center>
            {error ? (
              <>
                <Image
                  width={170}
                  height={170}
                  src={"/images/error.svg"}
                  alt="Email verification success"
                />
                <h4 className="font-bold text-gray-500 text-[14px]">
                  Không thể xác minh địa chỉ email
                </h4>
                <p className="text-[12px] text-gray-500">
                  Lỗi này thường do bạn đã xác minh địa chỉ email rồi hoặc
                  <br />
                  liên kết xác minh đã hết hạn. Vui lòng kiểm tra lại và thử lại
                  sau.
                </p>
                <Button
                  className="bg-primary-500 hover:bg-green-700 text-white text-[12px] font-semibold rounded-[5px] py-[5px] px-6 mt-3 h-7"
                  onClick={() => router.push("/")}
                >
                  Đi tới Bảng tin
                </Button>
              </>
            ) : (
              <>
                <Image
                  width={170}
                  height={170}
                  src={"/images/email-verification-success.svg"}
                  alt="Email verification success"
                />
                <h4 className="font-bold text-gray-500 text-[14px]">
                  Xác minh địa chỉ email thành công!
                </h4>
                <p className="text-[12px] text-gray-500">
                  Email của bạn đã được xác minh thành công. Bây giờ bạn có
                  <br />
                  thể tận hưởng quyền truy cập đầy đủ vào tất cả các tính năng.
                </p>
                <Button
                  className="bg-primary-500 hover:bg-green-700 text-white text-[12px] font-semibold rounded-[5px] py-[5px] px-6 mt-3 h-7"
                  onClick={() => router.push("/")}
                >
                  Đi tới Bảng tin
                </Button>
              </>
            )}
          </center>
        </div>
      </div>
    </div>
  );
};

export default EmailVerifyClient;
