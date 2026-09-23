import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Globe,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import { decodeLinkToken, isTrustedHost } from "@/utils/externalLink";
import BackButton from "./BackButton";

export const metadata = {
  title: "Kiểm tra liên kết - CBH Youth Online",
  description:
    "Kiểm tra độ an toàn của liên kết trước khi rời khỏi CBH Youth Online.",
  // The interstitial must never end up in search results standing in for the
  // site it points at.
  robots: { index: false, follow: false },
};

export default function LinkSafetyPage({ params }) {
  const target = decodeLinkToken(params?.token);

  if (!target) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-10 dark:bg-neutral-800">
        <section className="w-full max-w-lg rounded-xl bg-white p-6 text-center shadow-sm dark:bg-neutral-900 sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-neutral-100">
            Liên kết không hợp lệ
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-neutral-400">
            Chúng tôi không đọc được địa chỉ đích của liên kết này. Có thể liên
            kết đã bị sửa hoặc bị cắt mất một phần khi sao chép. Đừng truy cập
            nếu bạn không chắc nó đến từ đâu.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#319527] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#287a20]"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </section>
      </main>
    );
  }

  const url = new URL(target);

  // A token that decodes to our own domain doesn't need a warning at all -
  // send the user straight through rather than making them click twice.
  if (isTrustedHost(url.hostname)) {
    redirect(target);
  }

  const isInsecure = url.protocol === "http:";
  // "xn--" is the punycode marker: the domain contains non-ASCII characters,
  // which is how look-alike domains (Cyrillic "а" in place of "a") are built.
  const isPunycode = url.hostname.toLowerCase().includes("xn--");
  const pathAndQuery = `${url.pathname}${url.search}${url.hash}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-10 dark:bg-neutral-800">
      <section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <ShieldQuestion className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-neutral-100">
            Bạn đang rời khỏi CBH Youth Online
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-neutral-400">
            Liên kết này dẫn tới một trang web bên ngoài mà chúng tôi không kiểm
            soát. Luôn kiểm tra an toàn trước khi bấm vào.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
            Bạn đang truy cập
          </p>
          <div className="mt-2 flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500" />
            <span className="break-all text-base font-semibold text-gray-900 dark:text-neutral-100">
              {url.hostname}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-gray-600 dark:text-neutral-400">
            {/* Template literal, not `{url.protocol}//` - a bare "//" in JSX
                text reads as the start of a comment to the linter. */}
            <span className={isInsecure ? "text-red-600 dark:text-red-400" : ""}>
              {`${url.protocol}//`}
            </span>
            <span className="font-semibold text-gray-800 dark:text-neutral-200">
              {url.hostname}
            </span>
            {pathAndQuery === "/" ? "" : pathAndQuery}
          </p>
        </div>

        {(isInsecure || isPunycode) && (
          <div className="mt-4 space-y-2">
            {isPunycode && (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-900/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-xs leading-5 text-red-700 dark:text-red-300">
                  Tên miền này chứa ký tự đặc biệt được mã hóa. Đây là cách các
                  trang giả mạo thường dùng để trông giống một trang web quen
                  thuộc. Hãy cân nhắc kỹ trước khi truy cập.
                </p>
              </div>
            )}
            {isInsecure && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                  Liên kết này không dùng HTTPS. Mọi thông tin bạn gửi tới trang
                  này đều có thể bị người khác đọc được trên đường truyền.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-200">
            Trước khi tiếp tục, hãy kiểm tra:
          </p>
          {/* Each bullet's text is one <span>: the <li> is a flex container, so
              an inline <em> left as a direct child would become its own flex
              item and break out of the sentence. */}
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-gray-600 dark:text-neutral-400">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-gray-400">
                •
              </span>
              <span>
                Tên miền có đúng chính tả không? Các trang lừa đảo hay dùng tên
                gần giống, ví dụ <em>chuyenb1enhoa.com</em>.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-gray-400">
                •
              </span>
              <span>
                Không bao giờ nhập mật khẩu CBH Youth Online của bạn ở một trang
                web khác.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-gray-400">
                •
              </span>
              <span>
                Cẩn thận với trang yêu cầu tải tệp về, nhập mã OTP, số điện thoại
                hay thông tin thẻ ngân hàng.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-gray-400">
                •
              </span>
              <span>
                Nếu bạn không biết ai đã gửi liên kết này, tốt nhất là đừng truy
                cập.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <a
            href={target}
            rel="noopener noreferrer nofollow external"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#319527] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#287a20]"
          >
            Tiếp tục đến trang này
            <ExternalLink className="h-4 w-4" />
          </a>
          <BackButton className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </BackButton>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-gray-500 dark:text-neutral-500">
          Nếu bạn cho rằng liên kết này là lừa đảo hoặc có hại, hãy{" "}
          <Link
            href="/contact"
            className="font-medium text-[#319527] hover:underline dark:text-[#6bcf60]"
          >
            báo cho chúng tôi
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
