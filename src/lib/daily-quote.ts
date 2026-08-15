import type { LanguageCode } from "@/lib/i18n";

type Quote = { text: Record<LanguageCode, string>; author: string };

const QUOTES: Quote[] = [
  {
    text: {
      en: "Safety is not a slogan, it is the way we work.",
      ta: "பாதுகாப்பு ஒரு முழக்கம் அல்ல, அது நாம் வேலை செய்யும் முறை.",
      hi: "सुरक्षा एक नारा नहीं, यह हमारे काम करने का तरीका है।",
    },
    author: "SAIL Safety Council",
  },
  {
    text: {
      en: "Steel is strong, but the people who make it are stronger.",
      ta: "எஃகு வலிமையானது, ஆனால் அதை உருவாக்குபவர்கள் இன்னும் வலிமையானவர்கள்.",
      hi: "स्टील मजबूत है, पर उसे बनाने वाले लोग और भी मजबूत हैं।",
    },
    author: "Salem Steel Plant",
  },
  {
    text: {
      en: "Learn something small every day; skill is built shift by shift.",
      ta: "தினமும் சிறியதாக ஒன்றைக் கற்றுக்கொள்ளுங்கள்; திறன் ஒவ்வொரு ஷிப்டிலும் வளர்கிறது.",
      hi: "हर दिन कुछ छोटा सीखें; कौशल हर शिफ्ट में बनता है।",
    },
    author: "Knowledge Hub",
  },
  {
    text: {
      en: "Quality is doing it right when no one is watching.",
      ta: "யாரும் பார்க்காதபோதும் சரியாகச் செய்வதே தரம்.",
      hi: "गुणवत्ता वह है जो कोई न देख रहा हो तब भी सही करना।",
    },
    author: "Henry Ford",
  },
  {
    text: {
      en: "A careful hand today saves a life tomorrow.",
      ta: "இன்றைய கவனமான கை நாளைய உயிரைக் காக்கும்.",
      hi: "आज का सावधान हाथ कल की जान बचाता है।",
    },
    author: "Plant Safety Team",
  },
  {
    text: {
      en: "Teamwork turns raw metal into national strength.",
      ta: "குழு உழைப்பு மூலப்பொருளை நாட்டின் வலிமையாக மாற்றுகிறது.",
      hi: "टीम वर्क कच्ची धातु को राष्ट्र की शक्ति बनाता है।",
    },
    author: "SAIL",
  },
  {
    text: {
      en: "Discipline in small things builds trust in big ones.",
      ta: "சிறிய விஷயங்களில் ஒழுக்கம் பெரிய விஷயங்களில் நம்பிக்கையை உருவாக்கும்.",
      hi: "छोटी बातों का अनुशासन बड़ी बातों में भरोसा बनाता है।",
    },
    author: "Knowledge Hub",
  },
];

export function getDailyQuote(date = new Date()): Quote {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length]!;
}
