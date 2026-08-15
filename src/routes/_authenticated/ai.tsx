import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI Assistant — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "Ask the plant AI assistant about company processes, safety and policies.",
      },
      { property: "og:title", content: "AI Assistant — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Ask the plant AI assistant about company processes, safety and policies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const { t } = useI18n();
  return (
    <AppShell title={t("nav.ai")}>
      <ComingSoon title={t("ai.title")} note={t("ai.note")} />
    </AppShell>
  );
}
