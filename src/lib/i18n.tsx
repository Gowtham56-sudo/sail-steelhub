import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिन्दी" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "app.org": "SAIL — Salem Steel Plant",
  "app.name": "Employee Knowledge Management System",
  "app.shortName": "Knowledge Hub",
  "splash.tagline": "Knowledge. Safety. Excellence.",
  "login.title": "Employee Login",
  "login.subtitle": "Sign in with your employee number",
  "login.employeeNumber": "Employee Number",
  "login.employeeNumberHint": "Example: SSP10234",
  "login.password": "Password",
  "login.submit": "LOGIN",
  "login.forgot": "Forgot Password?",
  "login.adminLogin": "Administrator Login",
  "login.language": "Language",
  "login.help": "Trouble signing in? Contact the HR / IT department.",
  "common.loading": "Loading…",
};

const ta: Dictionary = {
  "app.org": "செயில் — சேலம் எஃகு ஆலை",
  "app.name": "ஊழியர் அறிவு மேலாண்மை அமைப்பு",
  "app.shortName": "அறிவு மையம்",
  "splash.tagline": "அறிவு. பாதுகாப்பு. சிறப்பு.",
  "login.title": "ஊழியர் உள்நுழைவு",
  "login.subtitle": "உங்கள் ஊழியர் எண்ணுடன் உள்நுழையவும்",
  "login.employeeNumber": "ஊழியர் எண்",
  "login.employeeNumberHint": "எடுத்துக்காட்டு: SSP10234",
  "login.password": "கடவுச்சொல்",
  "login.submit": "உள்நுழை",
  "login.forgot": "கடவுச்சொல் மறந்துவிட்டதா?",
  "login.adminLogin": "நிர்வாகி உள்நுழைவு",
  "login.language": "மொழி",
  "login.help": "உள்நுழைவதில் சிக்கலா? HR / IT பிரிவை தொடர்பு கொள்ளவும்.",
  "common.loading": "ஏற்றுகிறது…",
};

const hi: Dictionary = {
  "app.org": "सेल — सेलम स्टील प्लांट",
  "app.name": "कर्मचारी ज्ञान प्रबंधन प्रणाली",
  "app.shortName": "नॉलेज हब",
  "splash.tagline": "ज्ञान. सुरक्षा. उत्कृष्टता.",
  "login.title": "कर्मचारी लॉगिन",
  "login.subtitle": "अपने कर्मचारी नंबर से साइन इन करें",
  "login.employeeNumber": "कर्मचारी नंबर",
  "login.employeeNumberHint": "उदाहरण: SSP10234",
  "login.password": "पासवर्ड",
  "login.submit": "लॉगिन",
  "login.forgot": "पासवर्ड भूल गए?",
  "login.adminLogin": "प्रशासक लॉगिन",
  "login.language": "भाषा",
  "login.help": "लॉगिन में समस्या? HR / IT विभाग से संपर्क करें।",
  "common.loading": "लोड हो रहा है…",
};

const dictionaries: Record<LanguageCode, Dictionary> = { en, ta, hi };

const STORAGE_KEY = "sail.lang";

type I18nValue = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");

  // Read the saved language after hydration to avoid SSR mismatches.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ta" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => dictionaries[lang][key] ?? en[key] ?? key,
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
