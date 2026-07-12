const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || "com.fatties.youth";
const IOS_STORE_URL = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL || "https://apps.apple.com/app/id_YOUR_APP_STORE_ID";
const ANDROID_STORE_URL = process.env.NEXT_PUBLIC_ANDROID_STORE_URL || "https://play.google.com/store/apps/details?id=com.fatties.youth";

export const isIOSDevice = (userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "") => /iPhone|iPad|iPod/i.test(userAgent);
export const isAndroidDevice = (userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "") => /Android/i.test(userAgent);
export const isMobileDevice = (userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "") => isIOSDevice(userAgent) || isAndroidDevice(userAgent);

export const getDeepLinkTargets = (type, value, origin = typeof window !== "undefined" ? window.location.origin : "") => {
  const normalizedValue = encodeURIComponent(String(value));
  const customScheme = `${APP_SCHEME}://${type}/${normalizedValue}`;
  const universalLink = `${origin}/open/${type}/${normalizedValue}`;

  return {
    customScheme,
    universalLink,
    storeUrl: isIOSDevice() ? IOS_STORE_URL : ANDROID_STORE_URL,
  };
};

export const openDeepLink = (type, value, options = {}) => {
  if (typeof window === "undefined") return null;

  const { onFallback, delay = 2000, universalLinkDelay = 500 } = options;
  const targets = getDeepLinkTargets(type, value, window.location.origin);

  const fallbackToStore = () => {
    if (typeof onFallback === "function") {
      onFallback(targets.storeUrl, targets);
      return;
    }

    window.location.href = targets.storeUrl;
  };

  window.location.href = targets.customScheme;

  if (isIOSDevice()) {
    window.setTimeout(() => {
      if (document.hidden || document.visibilityState === "hidden") return;
      window.location.href = targets.universalLink;
    }, universalLinkDelay);
  }

  window.setTimeout(() => {
    if (!document.hidden && document.visibilityState !== "hidden") {
      fallbackToStore();
    }
  }, delay);

  return targets;
};
