import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "Plant events, celebrations and photo galleries for Salem Steel Plant staff.",
      },
      { property: "og:title", content: "Events — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Plant events, celebrations and photo galleries for Salem Steel Plant staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { t } = useI18n();
  return (
    <AppShell title={t("nav.events")}>
      <ComingSoon title={t("events.title")} note={t("events.note")} />
    </AppShell>
  );
}
