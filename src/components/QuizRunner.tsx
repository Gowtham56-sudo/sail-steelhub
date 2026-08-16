import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { getQuiz, submitQuiz } from "@/lib/knowledge.functions";
import { useI18n } from "@/lib/i18n";

type Results = Awaited<ReturnType<typeof submitQuiz>>;

export function QuizRunner({ moduleId, onExit }: { moduleId: string; onExit: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchQuiz = useServerFn(getQuiz);
  const sendQuiz = useServerFn(submitQuiz);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [warn, setWarn] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["quiz", moduleId],
    queryFn: () => fetchQuiz({ data: { moduleId } }),
  });

  const submit = useMutation({
    mutationFn: () => sendQuiz({ data: { moduleId, answers } }),
    onSuccess: (r) => {
      setResults(r);
      void queryClient.invalidateQueries({ queryKey: ["learning-feed"] });
    },
  });

  if (isPending || !data) {
    return (
      <p className="flex items-center gap-2 text-lg text-muted-foreground">
        <Loader2 aria-hidden className="size-5 animate-spin" />
        {t("common.loading")}
      </p>
    );
  }

  if (results) {
    const pct = Math.round((results.score / Math.max(results.total, 1)) * 100);
    return (
      <div>
        <section className="card-elevated p-6 text-center">
          <h1 className="text-xl font-bold">{t("knowledge.result")}</h1>
          <p className="mt-3 text-base text-muted-foreground">{t("knowledge.scored")}</p>
          <p className="mt-1 text-4xl font-extrabold text-primary">
            {results.score} / {results.total}
          </p>
          <p className="mt-1 text-lg font-semibold">{pct}%</p>
        </section>

        <ul className="mt-4 space-y-3">
          {results.results.map((r, i) => (
            <li key={r.id} className="card-elevated p-4">
              <p className="flex items-start gap-2 text-base font-bold">
                {r.isCorrect ? (
                  <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : (
                  <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
                )}
                <span>
                  {i + 1}. {r.question}
                </span>
              </p>
              <p className="mt-2 text-sm">
                {t("knowledge.yourAnswer")}:{" "}
                <span className="font-semibold">
                  {r.chosen === null ? t("knowledge.notAnswered") : r.options[r.chosen]}
                </span>
              </p>
              {!r.isCorrect && (
                <p className="mt-1 text-sm">
                  {t("knowledge.correctAnswer")}:{" "}
                  <span className="font-semibold text-primary">{r.options[r.correct_index]}</span>
                </p>
              )}
              {r.explanation && (
                <p className="mt-2 text-sm text-muted-foreground">{r.explanation}</p>
              )}
            </li>
          ))}
        </ul>

        <button type="button" onClick={onExit} className="btn-primary mt-5 w-full">
          {t("knowledge.backToList")}
        </button>
      </div>
    );
  }

  const total = data.questions.length;
  const q = data.questions[current];
  if (!q) return null;
  const chosen = answers[q.id];
  const isLast = current === total - 1;

  return (
    <div>
      <button
        type="button"
        onClick={onExit}
        className="mb-3 flex items-center gap-2 text-base font-semibold text-muted-foreground"
      >
        <ArrowLeft aria-hidden className="size-5" />
        {t("knowledge.backToList")}
      </button>

      <section className="card-elevated p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {t("knowledge.question")} {current + 1} {t("knowledge.of")} {total}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
        <h1 className="mt-4 text-xl font-bold leading-snug">{q.question}</h1>

        <div className="mt-4 space-y-3">
          {q.options.map((opt, i) => {
            const selected = chosen === i;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setAnswers((a) => ({ ...a, [q.id]: i }));
                  setWarn(false);
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-base font-semibold transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {warn && <p className="mt-3 text-base font-semibold text-destructive">{t("knowledge.selectAnswer")}</p>}

        <div className="mt-5 flex gap-3">
          {current > 0 && (
            <button
              type="button"
              onClick={() => setCurrent((c) => c - 1)}
              className="btn-secondary flex-1"
            >
              {t("knowledge.prev")}
            </button>
          )}
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => {
              if (chosen === undefined) {
                setWarn(true);
                return;
              }
              if (isLast) submit.mutate();
              else setCurrent((c) => c + 1);
            }}
            className="btn-primary flex-1"
          >
            {submit.isPending ? (
              <Loader2 aria-hidden className="mx-auto size-5 animate-spin" />
            ) : isLast ? (
              t("knowledge.submit")
            ) : (
              t("knowledge.next")
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
