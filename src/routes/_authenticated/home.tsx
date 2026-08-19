import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Cake, Award, BookOpen, Bot, CalendarDays, FileText, Quote } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { getHomeFeed } from "@/lib/home.functions";
import { getDailyQuote } from "@/lib/daily-quote";
import { InstallPrompt } from "@/components/InstallPrompt";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content:
          "Your personal SAIL Salem Steel Plant dashboard: profile, daily quote, celebrations and quick actions.",
      },
      { property: "og:title", content: "Home — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Employee dashboard for the SAIL Salem Steel Plant Knowledge Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  { to: "/knowledge", icon: BookOpen, key: "nav.knowledge" },
  { to: "/ai", icon: Bot, key: "nav.ai" },
  { to: "/events", icon: CalendarDays, key: "nav.events" },
  { to: "/circulars", icon: FileText, key: "nav.circulars" },
] as const;

function HomePage() {
  const { t, lang } = useI18n();
  const fetchFeed = useServerFn(getHomeFeed);

  const { data, isPending } = useQuery({
    queryKey: ["home-feed"],
    queryFn: () => fetchFeed(),
  });

  const quote = getDailyQuote();
  const profile = data?.profile;

  return (
    <AppShell title={t("app.shortName")}>
      {isPending ? (
        <p className="flex items-center gap-2 text-lg text-muted-foreground">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          {t("common.loading")}
        </p>
      ) : (
        <>
          <section className="card-elevated p-6">
            <p className="text-base text-muted-foreground">{t("home.welcome")}</p>
            <h1 className="mt-1 text-2xl font-bold">{profile?.full_name ?? "—"}</h1>
            <p className="mt-1 text-base text-muted-foreground">
              {[profile?.designation, profile?.department].filter(Boolean).join(" · ") || "—"}
            </p>
            <p className="mt-3 text-sm font-semibold tracking-wide">
              {t("home.employeeNumber")}: {profile?.employee_number ?? "—"}
            </p>
          </section>

          <section className="surface-steel mt-5 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary-foreground/85">
              <Quote aria-hidden className="size-4" />
              {t("home.quoteOfDay")}
            </div>
            <blockquote className="mt-3 text-xl font-semibold leading-snug">
              {quote.text[lang]}
            </blockquote>
            <p className="mt-3 text-sm text-primary-foreground/80">— {quote.author}</p>
          </section>

          <section className="mt-5">
            <h2 className="text-lg font-bold">{t("home.quickActions")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(({ to, icon: Icon, key }) => (
                <Link
                  key={to}
                  to={to}
                  className="card-elevated flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center text-base font-bold"
                >
                  <Icon aria-hidden className="size-7 text-primary" />
                  {t(key)}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Cake aria-hidden className="size-5 text-accent" />
              {t("home.birthdays")}
            </h2>
            {data && data.birthdays.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {data.birthdays.map((b) => (
                  <li key={b.id} className="card-elevated p-4">
                    <p className="text-lg font-bold">{b.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[b.designation, b.department].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-base text-muted-foreground">{t("home.noBirthdays")}</p>
            )}
          </section>

          <section className="mt-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Award aria-hidden className="size-5 text-accent" />
              {t("home.anniversaries")}
            </h2>
            {data && data.anniversaries.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {data.anniversaries.map((a) => (
                  <li key={a.id} className="card-elevated p-4">
                    <p className="text-lg font-bold">{a.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.years} {t("home.years")} ·{" "}
                      {[a.designation, a.department].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-base text-muted-foreground">{t("home.noAnniversaries")}</p>
            )}
          </section>

          <InstallPrompt />
        </>
      )}
    </AppShell>
  );
}
