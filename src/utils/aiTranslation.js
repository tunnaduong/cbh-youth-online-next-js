// Helper for Yoyo AI Translation on Web
// Supported target languages: Vietnamese (vi), English (en), Russian (ru), Simplified Chinese (zh)

export const AI_TRANSLATION_LANGUAGES = [
  { code: "auto", label: "Tự động (Tiếng Việt)", flag: "✨" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "Tiếng Anh (English)", flag: "🇬🇧" },
  { code: "ru", label: "Tiếng Nga (Русский)", flag: "🇷🇺" },
  { code: "zh", label: "Tiếng Trung Giản thể (简体中文)", flag: "🇨🇳" },
];

export const AI_TRANSLATE_STORAGE_KEY = "cbh_ai_translate_lang";

export function getAiTranslateLanguage() {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = localStorage.getItem(AI_TRANSLATE_STORAGE_KEY);
    if (!saved || saved === "auto") return "vi";
    if (["vi", "en", "ru", "zh"].includes(saved)) return saved;
    return "vi";
  } catch {
    return "vi";
  }
}

export function getAiTranslatePreference() {
  if (typeof window === "undefined") return "auto";
  try {
    return localStorage.getItem(AI_TRANSLATE_STORAGE_KEY) || "auto";
  } catch {
    return "auto";
  }
}

export function setAiTranslatePreference(code) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_TRANSLATE_STORAGE_KEY, code);
  } catch {}
}

export function getLanguageLabel(code) {
  const normCode = code === "zh-cn" ? "zh" : code;
  const found = AI_TRANSLATION_LANGUAGES.find((item) => item.code === normCode);
  return found ? found.label : "Tiếng Việt";
}
