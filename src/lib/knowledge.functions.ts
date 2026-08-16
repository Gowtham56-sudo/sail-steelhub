import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** List published learning modules plus the signed-in employee's attempt history. */
export const getLearningFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: modules } = await context.supabase
      .from("learning_modules")
      .select("id, title, summary, category, video_url, publish_date")
      .eq("is_published", true)
      .order("publish_date", { ascending: false });

    const { data: attempts } = await context.supabase
      .from("quiz_attempts")
      .select("id, module_id, score, total, completed_at")
      .eq("user_id", context.userId)
      .order("completed_at", { ascending: false });

    return { modules: modules ?? [], attempts: attempts ?? [] };
  });

/** Quiz questions for a module WITHOUT the correct answers. */
export const getQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { moduleId: string }) => {
    if (!data?.moduleId) throw new Error("moduleId is required");
    return { moduleId: data.moduleId };
  })
  .handler(async ({ data, context }) => {
    const { data: module } = await context.supabase
      .from("learning_modules")
      .select("id, title, summary, category, video_url, publish_date")
      .eq("id", data.moduleId)
      .eq("is_published", true)
      .maybeSingle();
    if (!module) throw new Error("Module not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, order_index, question, options")
      .eq("module_id", data.moduleId)
      .order("order_index", { ascending: true });

    return {
      module,
      questions: (rows ?? []).map((r) => ({
        id: r.id,
        order_index: r.order_index,
        question: r.question,
        options: (r.options as string[]) ?? [],
      })),
    };
  });

/** Grade a submitted quiz on the server and record the attempt. */
export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { moduleId: string; answers: Record<string, number> }) => {
    if (!data?.moduleId || typeof data.answers !== "object") throw new Error("Invalid submission");
    return { moduleId: data.moduleId, answers: data.answers };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, order_index, question, options, correct_index, explanation")
      .eq("module_id", data.moduleId)
      .order("order_index", { ascending: true });

    const questions = rows ?? [];
    const results = questions.map((q) => {
      const chosen = data.answers[q.id];
      return {
        id: q.id,
        question: q.question,
        options: (q.options as string[]) ?? [],
        chosen: typeof chosen === "number" ? chosen : null,
        correct_index: q.correct_index,
        explanation: q.explanation,
        isCorrect: chosen === q.correct_index,
      };
    });
    const score = results.filter((r) => r.isCorrect).length;

    await context.supabase.from("quiz_attempts").insert({
      user_id: context.userId,
      module_id: data.moduleId,
      score,
      total: questions.length,
      answers: results.map((r) => ({ id: r.id, chosen: r.chosen, correct: r.isCorrect })),
    });

    return { score, total: questions.length, results };
  });
