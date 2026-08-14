import { LANGUAGES, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="w-full">
      <p
        className={cn(
          "mb-2 text-center text-sm font-medium",
          variant === "dark" ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {t("login.language")}
      </p>
      <div
        role="group"
        aria-label={t("login.language")}
        className={cn(
          "grid grid-cols-3 gap-2 rounded-2xl p-1.5",
          variant === "dark" ? "bg-primary-foreground/10" : "bg-muted",
        )}
      >
        {LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={active}
              className={cn(
                "min-h-12 rounded-xl px-2 text-base font-semibold transition-all",
                active
                  ? "bg-card text-primary shadow-[var(--shadow-card)]"
                  : variant === "dark"
                    ? "text-primary-foreground/85 hover:bg-primary-foreground/10"
                    : "text-muted-foreground hover:bg-card/60",
              )}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
