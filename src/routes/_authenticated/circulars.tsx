import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/circulars")({
  head: () => ({
    meta: [
      { title: "Circulars — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "Searchable official circulars and notices for Salem Steel Plant employees.",
      },
      { property: "og:title", content: "Circulars — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Searchable official circulars and notices for Salem Steel Plant employees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CircularsPage,
});

function CircularsPage() {
  const { t } = useI18n();
  return (
    <AppShell title={t("nav.circulars")}>
      <ComingSoon title={t("circulars.title")} note={t("circulars.note")} />
    </AppShell>
  );
}
