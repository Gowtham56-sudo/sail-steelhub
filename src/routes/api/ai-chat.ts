import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type ChatMessage = { role: "user" | "assistant"; content: string };

type OpenAiErrorPayload = {
  error?: { code?: string | null; type?: string | null; message?: string | null };
};

const SYSTEM_PROMPT = `You are Steelix AI, the official AI assistant for SAIL — Salem Steel Plant (Steel Authority of India Limited), used by plant employees.
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

  const url = process.env["SUPABASE_URL"] || "https://xsmqabspeauyanvucogb.supabase.co";
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_FSnTQ2hqXbb2mla_iBmWug_cOBfNCNZ";
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

function getOpenAiError(detail: string): OpenAiErrorPayload["error"] {
  try {
    return (JSON.parse(detail) as OpenAiErrorPayload).error;
  } catch {
    return undefined;
  }
}

function getAiProvider(): "ollama" | "openai" {
  return process.env["AI_PROVIDER"]?.trim().toLowerCase() === "openai" ? "openai" : "ollama";
}

/** Convert Ollama's newline-delimited stream into the SSE shape used by the app. */
function ollamaToSse(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";

  function emitLine(line: string, controller: TransformStreamDefaultController<Uint8Array>) {
    if (!line.trim()) return;
    try {
      const item = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
      const content = item.message?.content;
      if (content) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`),
        );
      }
      if (item.done) controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    } catch {
      // A malformed provider chunk is ignored rather than ending the employee's session.
    }
  }

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        pending += decoder.decode(chunk, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) emitLine(line, controller);
      },
      flush(controller) {
        pending += decoder.decode();
        emitLine(pending, controller);
      },
    }),
  );
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyEmployee(request))) {
          return new Response("Unauthorized", { status: 401 });
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

        const provider = getAiProvider();
        let upstream: Response;
        try {
          if (provider === "ollama") {
            const baseUrl = (process.env["OLLAMA_BASE_URL"]?.trim() || "http://127.0.0.1:11434").replace(
              /\/$/,
              "",
            );
            const model = process.env["OLLAMA_MODEL"]?.trim() || "llama3.2:3b";
            upstream = await fetch(`${baseUrl}/api/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model,
                stream: true,
                messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
              }),
              signal: request.signal,
            });
          } else {
            const apiKey = process.env["OPENAI_API_KEY"];
            if (!apiKey) {
              return new Response("AI is not configured. Contact the IT department.", { status: 500 });
            }
            const model = process.env["OPENAI_MODEL"]?.trim() || "gpt-5-mini";
            upstream = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                stream: true,
                messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
              }),
              signal: request.signal,
            });
          }
        } catch {
          return new Response(
            provider === "ollama"
              ? "Free local AI is not running. Start Ollama on this computer, then try again."
              : "Steelix AI is unavailable. Please try again in a moment.",
            { status: 503 },
          );
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          if (provider === "ollama") {
            const message = detail.toLowerCase().includes("model")
              ? "The free local AI model is not installed. Run: ollama pull llama3.2:3b"
              : "Free local AI is unavailable. Start Ollama on this computer, then try again.";
            return new Response(message, { status: 503 });
          }
          const apiError = getOpenAiError(detail);
          const errorCode = apiError?.code ?? apiError?.type;
          const message =
            upstream.status === 401
              ? "AI configuration is invalid. Contact the IT department."
              : errorCode === "credit_balance_exhausted" || errorCode === "insufficient_quota"
                ? "AI service has no available API credit. Contact the IT department."
                : errorCode === "organization_usage_limit_exceeded" ||
                    errorCode === "organization_spend_limit_exceeded" ||
                    errorCode === "project_spend_limit_exceeded"
                  ? "AI service has reached its usage or spending limit. Contact the IT department."
                  : upstream.status === 429
              ? "Steelix AI is busy right now. Please try again in a moment."
              : upstream.status === 402
                ? "AI usage limit reached. Please contact the IT department."
                : `Steelix AI is unavailable (${upstream.status}). ${detail.slice(0, 200)}`;
          return new Response(message, { status: upstream.status });
        }

        return new Response(provider === "ollama" ? ollamaToSse(upstream.body) : upstream.body, {
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
