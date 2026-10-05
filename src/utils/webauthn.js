/**
 * Browser side of passkeys (WebAuthn). The API speaks JSON with base64url
 * strings; the browser API wants ArrayBuffers - these helpers convert both
 * ways and run the prompt.
 */

function toBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function toBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function passkeysSupported() {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );
}

// A prompt the user saw can't be closed this fast: a failure inside this
// window means the browser never opened it.
const INSTANT_FAILURE_MS = 1000;
const instantFailures = new WeakSet();

async function runPrompt(start) {
  const startedAt = Date.now();
  try {
    return await start();
  } catch (error) {
    if (error && typeof error === "object" && Date.now() - startedAt < INSTANT_FAILURE_MS) {
      instantFailures.add(error);
    }
    throw error;
  }
}

/**
 * True inside another app's built-in browser (Android WebView, Facebook,
 * Messenger, Instagram, Zalo, TikTok, Line). These expose the passkey API
 * but refuse every request, so the prompt never shows.
 */
export function inEmbeddedBrowser() {
  if (typeof navigator === "undefined") return false;
  return /; wv\)|FBAN|FBAV|FB_IAB|Instagram|Zalo|TikTok|musical_ly|Line\//i.test(
    navigator.userAgent || ""
  );
}

function onAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");
}

/**
 * What to tell the user when the browser's passkey prompt fails.
 *
 * The browser reports "NotAllowedError" for all of: the user closed the
 * prompt, the prompt timed out, and - on purpose, for privacy - "this device
 * has no passkey for this site" or "this device can't make one". It can't be
 * told apart from a cancel, so staying silent (as this used to) left the
 * button looking dead on a device without a passkey. Say what to do instead.
 *
 * @param {unknown} error
 * @param {"login" | "create"} mode
 * @returns {string | null} null when there is nothing worth showing
 */
export function passkeyErrorMessage(error, mode) {
  // An error answered by the API: its message is already for the user.
  if (error?.response?.data?.message) return error.response.data.message;

  const refused = error?.name === "NotAllowedError" || error?.name === "NotSupportedError";
  if (refused && inEmbeddedBrowser()) {
    return "Trình duyệt bên trong ứng dụng này không dùng được passkey. Hãy mở chuyenbienhoa.com bằng Chrome hoặc Safari rồi thử lại.";
  }

  switch (error?.name) {
    case "AbortError":
      return null;
    case "NotAllowedError":
      // Typical of Android browsers other than Chrome (and of phones without
      // Google Play services): the API is there but nothing answers it.
      if (instantFailures.has(error)) {
        return onAndroid()
          ? "Trình duyệt này không mở được hộp thoại passkey. Hãy thử lại; nếu vẫn không được, hãy mở trang bằng Chrome và kiểm tra điện thoại đã bật khóa màn hình và đã đăng nhập tài khoản Google."
          : "Trình duyệt này không mở được hộp thoại passkey. Hãy thử lại; nếu vẫn không được, hãy mở trang bằng Chrome hoặc Safari.";
      }
      if (mode !== "create") {
        return "Chưa đăng nhập được bằng passkey. Nếu thiết bị này chưa có passkey của bạn, hãy đăng nhập bằng mật khẩu rồi thêm passkey trong Cài đặt → Tài khoản.";
      }
      return onAndroid()
        ? "Chưa tạo được passkey. Điện thoại cần có khóa màn hình (vân tay, khuôn mặt hoặc mã PIN) và đã đăng nhập tài khoản Google để lưu passkey; hãy dùng Chrome nếu trình duyệt này không lưu được."
        : "Chưa tạo được passkey. Thiết bị cần có khóa màn hình (vân tay, khuôn mặt, mã PIN hoặc Windows Hello); nếu không, hãy chọn dùng điện thoại hoặc khóa bảo mật trong hộp thoại của trình duyệt.";
    case "InvalidStateError":
      return "Thiết bị này đã có passkey cho tài khoản của bạn.";
    case "SecurityError":
      return "Passkey chỉ dùng được trên chuyenbienhoa.com.";
    case "NotSupportedError":
      return "Thiết bị hoặc trình duyệt này không hỗ trợ loại passkey cần dùng.";
    default:
      return error?.message || "Có lỗi xảy ra với passkey. Vui lòng thử lại.";
  }
}

/**
 * Whether this device can hold a passkey itself (screen lock / Windows
 * Hello / Touch ID). When it can't, a phone or a security key still works.
 */
export async function platformPasskeyAvailable() {
  try {
    return (
      passkeysSupported() &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function" &&
      (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

// The API's login challenge lives 5 minutes; stop using a fetched one a bit
// before that.
const LOGIN_OPTIONS_MAX_AGE_MS = 4 * 60 * 1000;

/**
 * Keeps login options ready before the user taps the passkey button.
 *
 * Safari (iPhone, iPad, Mac) only opens the passkey prompt while it is
 * still handling the tap. Asking the API for the options first puts a
 * network request between the tap and the prompt, and Safari then refuses
 * with NotAllowedError. With the options fetched ahead, the tap goes
 * straight to the prompt on every browser.
 *
 *   const prepared = prepareLoginOptions(fetchOptions);   // on mount
 *   const options = await prepared.take();                 // in the click
 *
 * `fetchOptions` resolves to the API's { request_id, publicKey }. Each set
 * of options is handed out once (the API accepts a challenge once), and the
 * next one is fetched right away.
 */
export function prepareLoginOptions(fetchOptions) {
  let ready = null; // { options, at }
  let loading = null;

  const load = () => {
    loading = fetchOptions()
      .then((options) => {
        ready = { options, at: Date.now() };
      })
      .catch(() => {
        ready = null;
      })
      .finally(() => {
        loading = null;
      });
    return loading;
  };

  load();

  return {
    async take() {
      // A fetch already on its way is quicker than starting another.
      if (!ready && loading) await loading;
      const fresh = ready && Date.now() - ready.at < LOGIN_OPTIONS_MAX_AGE_MS ? ready.options : null;
      ready = null;
      if (fresh) {
        load();
        return fresh;
      }
      // Nothing usable yet (slow network, or the page sat open): fetch now.
      // On Safari this attempt may be refused; the next tap has options ready.
      const options = await fetchOptions();
      load();
      return options;
    },
  };
}

/**
 * Create a passkey from the API's registration options
 * (POST /v1.0/passkeys/options). Returns the payload for POST /v1.0/passkeys.
 */
export async function createPasskey(publicKey) {
  const options = {
    publicKey: {
      ...publicKey,
      challenge: toBuffer(publicKey.challenge),
      user: { ...publicKey.user, id: toBuffer(publicKey.user.id) },
      excludeCredentials: (publicKey.excludeCredentials || []).map((item) => ({
        ...item,
        id: toBuffer(item.id),
      })),
    },
  };
  const credential = await runPrompt(() => navigator.credentials.create(options));

  return {
    id: credential.id,
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      attestationObject: toBase64Url(credential.response.attestationObject),
    },
  };
}

/**
 * Ask for a passkey with the API's login options
 * (POST /v1.0/login/passkey/options). Returns the payload for
 * POST /v1.0/login/passkey.
 */
export async function getPasskey(publicKey) {
  const options = {
    publicKey: {
      ...publicKey,
      challenge: toBuffer(publicKey.challenge),
      allowCredentials: (publicKey.allowCredentials || []).map((item) => ({
        ...item,
        id: toBuffer(item.id),
      })),
    },
  };
  const credential = await runPrompt(() => navigator.credentials.get(options));

  return {
    id: credential.id,
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      authenticatorData: toBase64Url(credential.response.authenticatorData),
      signature: toBase64Url(credential.response.signature),
    },
  };
}
