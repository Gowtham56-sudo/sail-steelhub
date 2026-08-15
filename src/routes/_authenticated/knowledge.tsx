import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "Daily learning videos and quizzes for Salem Steel Plant employees.",
      },
      { property: "og:title", content: "Knowledge — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Daily learning videos and quizzes for Salem Steel Plant employees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { t } = useI18n();
  return (
    <AppShell title={t("nav.knowledge")}>
      <ComingSoon title={t("knowledge.title")} note={t("knowledge.note")} />
    </AppShell>
  );
}
