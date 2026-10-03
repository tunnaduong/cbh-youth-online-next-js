"use client";

import { useEffect, useRef, useState } from "react";
import { getPasskey, isPasskeyCancel, passkeysSupported } from "@/utils/webauthn";

// App schemes this page may hand a login back to (same list as the API's
// OAuth callback page).
const APP_SCHEMES = ["com.fatties.youth", "exp+cbh-youth-online-mobile"];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function post(path, body) {
  // Plain fetch, not the axios instance: this page runs in the app's in-app
  // browser and must not touch (or sign out) a web session in that browser.
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Đăng nhập bằng passkey thất bại.");
  return data;
}

/**
 * Passkey login for the mobile app. The app has no native passkey module, so
 * it opens this page in its in-app browser with `#app_challenge=...&scheme=...`
 * (sha256 of a secret the app keeps). The passkey prompt runs here; the API
 * returns a one-time code instead of a token, and the page hands that code
 * back to the app through its deep link. Only the app, which holds the
 * secret, can turn the code into a login.
 */
export default function PasskeyAppLoginPage() {
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [error, setError] = useState("");
  const params = useRef({ appChallenge: "", scheme: "" });

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    params.current = {
      appChallenge: hash.get("app_challenge") || "",
      scheme: hash.get("scheme") || "",
    };

    if (!/^[0-9a-f]{64}$/i.test(params.current.appChallenge) || !APP_SCHEMES.includes(params.current.scheme)) {
      setStatus("error");
      setError("Liên kết đăng nhập không hợp lệ. Hãy mở lại từ ứng dụng.");
      return;
    }
    if (!passkeysSupported()) {
      setStatus("error");
      setError("Thiết bị này không hỗ trợ passkey.");
    }
  }, []);

  const login = async () => {
    if (status === "working") return;
    setStatus("working");
    setError("");
    try {
      const options = await post("/v1.0/login/passkey/options");
      const credential = await getPasskey(options.publicKey);
      const { code } = await post("/v1.0/login/passkey", {
        request_id: options.request_id,
        credential,
        app_challenge: params.current.appChallenge,
      });

      setStatus("done");
      // Single colon (not ://), like the OAuth callback: some Android
      // browsers mangle the other form.
      window.location.href = `${params.current.scheme}:passkey?code=${encodeURIComponent(code)}`;
    } catch (err) {
      setStatus("idle");
      if (!isPasskeyCancel(err)) setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eaf3ef] dark:bg-neutral-800 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white dark:!bg-neutral-700 dark:!border-neutral-500 p-6 text-center shadow">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Đăng nhập bằng passkey
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-300">
          {status === "done"
            ? "Đã xác thực. Đang quay lại ứng dụng..."
            : "Dùng vân tay, khuôn mặt hoặc mã khóa màn hình để đăng nhập vào CBH Youth Online."}
        </p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        {status !== "done" && status !== "error" && (
          <button
            type="button"
            onClick={login}
            disabled={status === "working"}
            className="mt-5 w-full rounded-lg bg-[#319527] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "working" ? "Đang chờ passkey..." : "Tiếp tục"}
          </button>
        )}
      </div>
    </div>
  );
}
