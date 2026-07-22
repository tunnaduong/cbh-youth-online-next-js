import Link from "next/link";

export const metadata = {
  title: "Hủy nhận bản tin - CBH Youth Online",
};

export default async function UnsubscribePage({ searchParams }) {
  const params = await searchParams;
  const success = params?.status === "success";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          {success ? "Đã hủy nhận bản tin" : "Liên kết không hợp lệ"}
        </h1>
        <p className="mt-4 leading-7 text-gray-600">
          {success
            ? "Bạn sẽ không còn nhận các email thông báo xã hội từ CBH Youth Online. Email bảo mật và email liên quan đến tài khoản vẫn có thể được gửi khi cần thiết."
            : "Liên kết hủy nhận bản tin không hợp lệ hoặc đã hết hạn. Bạn có thể quản lý các tùy chọn thông báo trong phần cài đặt tài khoản."}
        </p>
        <Link
          href="/settings"
          className="mt-6 inline-block rounded-md bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
        >
          Mở cài đặt thông báo
        </Link>
      </section>
    </main>
  );
}
