import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the official AI assistant for SAIL — Salem Steel Plant (Steel Authority of India Limited), used by plant employees.
Answer questions about steel-making processes, stainless steel cold rolling, plant safety (PPE, fire safety, emergency response), HR policies, employee benefits, training and general workplace guidance.
Rules:
- Be professional, concise and practical. Prefer short paragraphs and numbered steps.
- Use simple language suitable for employees of all ages; avoid jargon unless you explain it.
- Reply in the same language the employee used (English, Tamil or Hindi).
- Safety answers must always reference correct PPE and standard emergency procedure.
- If a question needs official confirmation (pay, leave records, personal data), say so and advise contacting the HR / IT department. Never invent plant-specific numbers, names or circular references.`;

async function verifyEmployee(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  if (token.split(".").length !== 3) return false;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  return Boolean(!error && data?.claims?.sub);
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyEmployee(request))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured. Contact the IT department.", { status: 500 });
        }

        let body: { messages?: ChatMessage[] };
        try {
          body = (await request.json()) as { messages?: ChatMessage[] };
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const history = (body.messages ?? [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-16)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

        if (history.length === 0) {
          return new Response("No message provided", { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            stream: true,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
          }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "The assistant is busy right now. Please try again in a moment."
              : upstream.status === 402
                ? "AI usage limit reached. Please contact the IT department."
                : `Assistant unavailable (${upstream.status}). ${detail.slice(0, 200)}`;
          return new Response(message, { status: upstream.status });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-store",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
