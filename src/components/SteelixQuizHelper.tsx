import { useEffect, useState } from "react";
import { Bot, ChevronDown, ChevronUp, Loader2, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

type SteelixQuizHelperProps = {
  moduleTitle: string;
  question: string;
  options: string[];
};

/**
 * A focused Steelix AI panel for the question currently visible in a quiz.
 * Only the question and answer options are provided to the model: the correct
 * answer remains on the server until the employee submits the quiz.
 */
export function SteelixQuizHelper({ moduleTitle, question, options }: SteelixQuizHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each quiz question has its own short conversation, preventing help for an
  // earlier question from being confused with the current one.
  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [question]);

  async function askSteelix(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;

    const next = [...messages, { role: "user" as const, content: prompt }];
    const [first, ...rest] = next;
    if (!first) return;
    const optionText = options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n");
    const requestMessages: Message[] = [
      {
        role: "user",
        content: `I am taking the SAIL learning quiz for “${moduleTitle}”.\n\nCurrent question:\n${question}\n\nOptions:\n${optionText}\n\nHelp request: ${first.content}\n\nExplain the concept and the reasoning clearly so I can choose and finish the quiz. Do not claim that you can see a hidden answer key.`,
      },
      ...rest,
    ];

    setError(null);
    setInput("");
    setMessages(next);
    setBusy(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: requestMessages }),
      });

      if (!response.ok || !response.body) {
        setError((await response.text().catch(() => "")) || "Steelix AI could not answer right now.");
        return;
      }

      const reader = response.body.getReader();
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
          const payload = line.trim().startsWith("data:") ? line.trim().slice(5).trim() : "";
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
            const content = chunk.choices?.[0]?.delta?.content;
            if (!content) continue;
            answer += content;
            if (!started) {
              started = true;
              setMessages((current) => [...current, { role: "assistant", content: answer }]);
            } else {
              setMessages((current) => {
                const copy = [...current];
                copy[copy.length - 1] = { role: "assistant", content: answer };
                return copy;
              });
            }
          } catch {
            // Partial stream chunks are expected while the model is writing.
          }
        }
      }
      if (!started) setError("Steelix AI could not answer right now. Please try again.");
    } catch {
      setError("Steelix AI could not answer right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border-2 border-primary/25 bg-primary/5">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
      >
        <span className="rounded-full bg-primary p-2 text-primary-foreground">
          <Bot aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold">Steelix AI — Quiz help</span>
          <span className="block text-sm text-muted-foreground">Ask for an explanation before you finish this question.</span>
        </span>
        {isOpen ? <ChevronUp aria-hidden className="size-5 text-primary" /> : <ChevronDown aria-hidden className="size-5 text-primary" />}
      </button>

      {isOpen ? (
        <div className="border-t border-primary/20 bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Steelix AI sees this question and its options, not the hidden answer key. Use the explanation to make your own choice.
          </p>
          {messages.length === 0 ? (
            <button
              type="button"
              onClick={() => void askSteelix("Please explain this question and help me choose the best option.")}
              disabled={busy}
              className="mt-3 min-h-11 rounded-xl border-2 border-primary px-3 text-sm font-bold text-primary"
            >
              Explain this question
            </button>
          ) : null}

          <div className="mt-3 space-y-2" aria-live="polite">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-5 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "rounded-xl bg-muted px-3 py-2 text-sm"
                }
              >
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-80">
                  {message.role === "user" ? <User aria-hidden className="size-3.5" /> : <Bot aria-hidden className="size-3.5" />}
                  {message.role === "user" ? "You" : "Steelix AI"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </article>
            ))}
            {busy ? (
              <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Loader2 aria-hidden className="size-4 animate-spin" /> Steelix AI is thinking…
              </p>
            ) : null}
          </div>

          {error ? <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void askSteelix(input);
            }}
          >
            <input
              value={input}
              maxLength={500}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Steelix AI about this question…"
              className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-border bg-background px-3 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Ask Steelix AI"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
