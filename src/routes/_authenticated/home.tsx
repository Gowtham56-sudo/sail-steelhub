import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Loader2 } from "lucide-react";
import { SailLogo } from "@/components/SailLogo";
import { useI18n } from "@/lib/i18n";
import { getMyProfile } from "@/lib/employee-auth.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content:
          "Your personal SAIL Salem Steel Plant dashboard: profile, learning, events and circulars.",
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

function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);

  const { data, isPending } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const profile = data?.profile;

  return (
    <main className="min-h-screen bg-background">
      <header className="surface-steel flex items-center gap-3 px-5 py-5">
        <div className="rounded-full bg-primary-foreground/95 p-2">
          <SailLogo size={40} priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{t("app.org")}</p>
          <p className="truncate text-sm text-primary-foreground/85">{t("app.shortName")}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label={t("home.signOut")}
          className="flex min-h-12 items-center gap-2 rounded-xl border border-primary-foreground/30 px-3 text-sm font-semibold"
        >
          <LogOut aria-hidden className="size-5" />
          {t("home.signOut")}
        </button>
      </header>

      <div className="mx-auto w-full max-w-md px-4 py-6">
        {isPending ? (
          <p className="flex items-center gap-2 text-lg text-muted-foreground">
            <Loader2 aria-hidden className="size-5 animate-spin" />
            {t("common.loading")}
          </p>
        ) : (
          <section className="card-elevated p-6">
            <p className="text-base text-muted-foreground">{t("home.welcome")}</p>
            <h1 className="mt-1 text-2xl font-bold">{profile?.full_name ?? "—"}</h1>

            <dl className="mt-5 space-y-4 text-lg">
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  {t("home.employeeNumber")}
                </dt>
                <dd className="font-bold tracking-wide">{profile?.employee_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  {t("home.designation")}
                </dt>
                <dd>{profile?.designation ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  {t("home.department")}
                </dt>
                <dd>{profile?.department ?? "—"}</dd>
              </div>
            </dl>

            {data?.roles.includes("admin") ? (
              <p className="mt-5 inline-block rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent">
                ADMINISTRATOR
              </p>
            ) : null}
          </section>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">{t("home.stageNote")}</p>
      </div>
    </main>
  );
}
