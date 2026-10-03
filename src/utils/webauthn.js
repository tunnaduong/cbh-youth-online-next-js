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

/** True when the user closed or cancelled the browser's passkey prompt. */
export function isPasskeyCancel(error) {
  return error?.name === "NotAllowedError" || error?.name === "AbortError";
}

/**
 * Create a passkey from the API's registration options
 * (POST /v1.0/passkeys/options). Returns the payload for POST /v1.0/passkeys.
 */
export async function createPasskey(publicKey) {
  const credential = await navigator.credentials.create({
    publicKey: {
      ...publicKey,
      challenge: toBuffer(publicKey.challenge),
      user: { ...publicKey.user, id: toBuffer(publicKey.user.id) },
      excludeCredentials: (publicKey.excludeCredentials || []).map((item) => ({
        ...item,
        id: toBuffer(item.id),
      })),
    },
  });

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
  const credential = await navigator.credentials.get({
    publicKey: {
      ...publicKey,
      challenge: toBuffer(publicKey.challenge),
      allowCredentials: (publicKey.allowCredentials || []).map((item) => ({
        ...item,
        id: toBuffer(item.id),
      })),
    },
  });

  return {
    id: credential.id,
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      authenticatorData: toBase64Url(credential.response.authenticatorData),
      signature: toBase64Url(credential.response.signature),
    },
  };
}
