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
  "activate.title": "First-time Activation",
  "activate.subtitle": "Confirm your identity and create your password",
  "activate.dob": "Date of Birth",
  "activate.newPassword": "Create Password",
  "activate.confirmPassword": "Confirm Password",
  "activate.submit": "ACTIVATE & SIGN IN",
  "activate.back": "Back to Login",
  "activate.mismatch": "The two passwords do not match.",
  "activate.weak": "Password must be at least 8 characters.",
  "home.welcome": "Welcome",
  "home.signOut": "Sign Out",
  "home.employeeNumber": "Employee Number",
  "home.department": "Department",
  "home.designation": "Designation",
  "home.stageNote": "Home dashboard, learning, AI, events and circulars arrive in the next stages.",
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
  "activate.title": "\u0bae\u0bc1\u0ba4\u0bb2\u0bcd \u0bae\u0bc1\u0bb1\u0bc8 \u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bb2\u0bcd",
  "activate.subtitle": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b85\u0b9f\u0bc8\u0baf\u0bbe\u0bb3\u0ba4\u0bcd\u0ba4\u0bc8 \u0b89\u0bb1\u0bc1\u0ba4\u0bbf\u0b9a\u0bc6\u0baf\u0bcd\u0ba4\u0bc1 \u0b95\u0b9f\u0bb5\u0bc1\u0b9a\u0bcd\u0b9a\u0bca\u0bb2\u0bcd\u0bb2\u0bc8 \u0b89\u0bb0\u0bc1\u0bb5\u0bbe\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd",
  "activate.dob": "\u0baa\u0bbf\u0bb1\u0ba8\u0bcd\u0ba4 \u0ba4\u0bc7\u0ba4\u0bbf",
  "activate.newPassword": "\u0b95\u0b9f\u0bb5\u0bc1\u0b9a\u0bcd\u0b9a\u0bca\u0bb2\u0bcd\u0bb2\u0bc8 \u0b89\u0bb0\u0bc1\u0bb5\u0bbe\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd",
  "activate.confirmPassword": "\u0b95\u0b9f\u0bb5\u0bc1\u0b9a\u0bcd\u0b9a\u0bca\u0bb2\u0bcd\u0bb2\u0bc8 \u0b89\u0bb1\u0bc1\u0ba4\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bb5\u0bc1\u0bae\u0bcd",
  "activate.submit": "\u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bbf \u0b89\u0bb3\u0bcd\u0ba8\u0bc1\u0bb4\u0bc8",
  "activate.back": "\u0b89\u0bb3\u0bcd\u0ba8\u0bc1\u0bb4\u0bc8\u0bb5\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0ba4\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0bae\u0bcd\u0baa\u0bc1",
  "activate.mismatch": "\u0b87\u0bb0\u0ba3\u0bcd\u0b9f\u0bc1 \u0b95\u0b9f\u0bb5\u0bc1\u0b9a\u0bcd\u0b9a\u0bca\u0bb1\u0bcd\u0b95\u0bb3\u0bc1\u0bae\u0bcd \u0baa\u0bca\u0bb0\u0bc1\u0ba8\u0bcd\u0ba4\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8.",
  "activate.weak": "\u0b95\u0b9f\u0bb5\u0bc1\u0b9a\u0bcd\u0b9a\u0bca\u0bb2\u0bcd \u0b95\u0bc1\u0bb1\u0bc8\u0ba8\u0bcd\u0ba4\u0ba4\u0bc1 8 \u0b8e\u0bb4\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0b95\u0bb3\u0bcd \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95 \u0bb5\u0bc7\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd.",
  "home.welcome": "\u0bb5\u0ba3\u0b95\u0bcd\u0b95\u0bae\u0bcd",
  "home.signOut": "\u0bb5\u0bc6\u0bb3\u0bbf\u0baf\u0bc7\u0bb1\u0bc1",
  "home.employeeNumber": "\u0b8a\u0bb4\u0bbf\u0baf\u0bb0\u0bcd \u0b8e\u0ba3\u0bcd",
  "home.department": "\u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
  "home.designation": "\u0baa\u0ba4\u0bb5\u0bbf",
  "home.stageNote": "\u0bae\u0bc1\u0b95\u0baa\u0bcd\u0baa\u0bc1, \u0b95\u0bb1\u0bcd\u0bb1\u0bb2\u0bcd, AI, \u0ba8\u0bbf\u0b95\u0bb4\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b9a\u0bc1\u0bb1\u0bcd\u0bb1\u0bb1\u0bbf\u0b95\u0bcd\u0b95\u0bc8\u0b95\u0bb3\u0bcd \u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 \u0b95\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bbf\u0bb2\u0bcd \u0bb5\u0bb0\u0bc1\u0bae\u0bcd.",
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
  "activate.title": "\u092a\u0939\u0932\u0940 \u092c\u093e\u0930 \u0938\u0915\u094d\u0930\u093f\u092f\u0923",
  "activate.subtitle": "\u0905\u092a\u0928\u0940 \u092a\u0939\u091a\u093e\u0928 \u0915\u0940 \u092a\u0941\u0937\u094d\u091f\u093f \u0915\u0930\u0947\u0902 \u0914\u0930 \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092c\u0928\u093e\u090f\u0902",
  "activate.dob": "\u091c\u0928\u094d\u092e \u0924\u093f\u0925\u093f",
  "activate.newPassword": "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092c\u0928\u093e\u090f\u0902",
  "activate.confirmPassword": "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0915\u0940 \u092a\u0941\u0937\u094d\u091f\u093f \u0915\u0930\u0947\u0902",
  "activate.submit": "\u0938\u0915\u094d\u0930\u093f\u092f \u0915\u0930\u0947\u0902 \u0914\u0930 \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
  "activate.back": "\u0932\u0949\u0917\u093f\u0928 \u092a\u0930 \u0935\u093e\u092a\u0938",
  "activate.mismatch": "\u0926\u094b\u0928\u094b\u0902 \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092e\u0947\u0932 \u0928\u0939\u0940\u0902 \u0916\u093e\u0924\u0947\u0964",
  "activate.weak": "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0915\u092e \u0938\u0947 \u0915\u092e 8 \u0905\u0915\u094d\u0937\u0930\u094b\u0902 \u0915\u093e \u0939\u094b\u0928\u093e \u091a\u093e\u0939\u093f\u090f\u0964",
  "home.welcome": "\u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948",
  "home.signOut": "\u0938\u093e\u0907\u0928 \u0906\u0909\u091f",
  "home.employeeNumber": "\u0915\u0930\u094d\u092e\u091a\u093e\u0930\u0940 \u0928\u0902\u092c\u0930",
  "home.department": "\u0935\u093f\u092d\u093e\u0917",
  "home.designation": "\u092a\u0926\u0928\u093e\u092e",
  "home.stageNote": "\u0939\u094b\u092e, \u0932\u0930\u094d\u0928\u093f\u0902\u0917, AI, \u0907\u0935\u0947\u0902\u091f\u094d\u0938 \u0914\u0930 \u0938\u0930\u094d\u0915\u0941\u0932\u0930 \u0905\u0917\u0932\u0947 \u091a\u0930\u0923\u094b\u0902 \u092e\u0947\u0902 \u0906\u090f\u0902\u0917\u0947\u0964",
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
