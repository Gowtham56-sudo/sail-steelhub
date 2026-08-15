import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { getMyProfile } from "@/lib/employee-auth.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "View your official Salem Steel Plant employee record and app settings.",
      },
      { property: "og:title", content: "My Profile — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "View your official Salem Steel Plant employee record and app settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-lg">{value ?? "—"}</dd>
    </div>
  );
}

function ProfilePage() {
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

  const p = data?.profile;

  return (
    <AppShell title={t("nav.profile")}>
      {isPending ? (
        <p className="flex items-center gap-2 text-lg text-muted-foreground">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          {t("common.loading")}
        </p>
      ) : (
        <section className="card-elevated p-6">
          <h1 className="text-2xl font-bold">{p?.full_name ?? "—"}</h1>
          {data?.roles.includes("admin") ? (
            <p className="mt-2 inline-block rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent">
              ADMINISTRATOR
            </p>
          ) : null}
          <dl className="mt-5 space-y-4">
            <Row label={t("home.employeeNumber")} value={p?.employee_number} />
            <Row label={t("home.designation")} value={p?.designation} />
            <Row label={t("home.department")} value={p?.department} />
            <Row label={t("profile.joined")} value={p?.date_of_joining} />
            <Row label={t("profile.email")} value={p?.work_email} />
            <Row label={t("profile.phone")} value={p?.phone} />
          </dl>
        </section>
      )}

      <section className="card-elevated mt-5 p-6">
        <LanguageSelector />
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive px-4 text-lg font-bold text-destructive"
      >
        <LogOut aria-hidden className="size-5" />
        {t("home.signOut")}
      </button>
    </AppShell>
  );
}
