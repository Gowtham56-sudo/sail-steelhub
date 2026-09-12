import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "Steelix AI — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content: "Ask Steelix AI about company processes, safety and policies.",
      },
      { property: "og:title", content: "Steelix AI — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Ask Steelix AI about company processes, safety and policies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

type Message = { role: "user" | "assistant"; content: string };

function AiPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const suggestions = [t("ai.s1"), t("ai.s2"), t("ai.s3")];

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setBusy(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        setError((await res.text().catch(() => "")) || t("ai.error"));
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let started = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (!delta) continue;
            answer += delta;
            if (!started) {
              started = true;
              setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
            } else {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: answer };
                return copy;
              });
            }
          } catch {
            /* ignore partial chunk */
          }
        }
      }

      if (!started) setError(t("ai.error"));
    } catch {
      setError(t("ai.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t("nav.ai")}>
      <section className="card-elevated p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bot aria-hidden className="size-7 text-primary" />
          {t("ai.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{t("ai.subtitle")}</p>
      </section>

      <section className="mt-4 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <div className="card-elevated p-5">
            <p className="text-base font-semibold">{t("ai.empty")}</p>
            <ul className="mt-3 space-y-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className="btn-secondary w-full text-left" onClick={() => void send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <article
            key={`${m.role}-${i}`}
            className={
              m.role === "user"
                ? "ml-6 rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                : "card-elevated mr-2 px-4 py-3"
            }
          >
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-80">
              {m.role === "user" ? <User aria-hidden className="size-4" /> : <Bot aria-hidden className="size-4" />}
              {m.role === "user" ? t("ai.you") : t("ai.assistant")}
            </p>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{m.content}</p>
          </article>
        ))}

        {busy && <p className="px-2 text-base text-muted-foreground">{t("ai.thinking")}</p>}
        {error && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </section>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="ai-input" className="sr-only">
          {t("ai.placeholder")}
        </label>
        <textarea
          id="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder={t("ai.placeholder")}
          className="w-full rounded-xl border-2 border-input bg-card p-3 text-base focus:border-primary focus:outline-none"
        />
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex flex-1 items-center justify-center gap-2" disabled={busy || !input.trim()}>
            <Send aria-hidden className="size-5" />
            {t("ai.send")}
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn-secondary flex items-center justify-center gap-2 px-4"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
            >
              <Trash2 aria-hidden className="size-5" />
              <span className="sr-only">{t("ai.clear")}</span>
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("ai.disclaimer")}</p>
      </form>
    </AppShell>
  );
}
