import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowLeft, CalendarDays, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { SailLogo } from "@/components/SailLogo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { activateAccount, getAccountStatus, getMyProfile } from "@/lib/employee-auth.functions";
import {
  employeeNumberToAuthEmail,
  normalizeEmployeeNumber,
  MIN_PASSWORD_LENGTH,
} from "@/lib/employee-account";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Employee Login — SAIL Salem Steel Plant" },
      {
        name: "description",
        content:
          "Secure employee login for the SAIL Salem Steel Plant Knowledge Management System.",
      },
      { property: "og:title", content: "Employee Login — SAIL Salem Steel Plant" },
      {
        property: "og:description",
        content: "Sign in with your employee number to access the SAIL Knowledge Hub.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const checkStatus = useServerFn(getAccountStatus);
  const activate = useServerFn(activateAccount);
  const loadProfile = useServerFn(getMyProfile);

  const [adminMode, setAdminMode] = useState(false);
  const [step, setStep] = useState<"login" | "activate">("login");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signInWith(pwd: string) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employeeNumberToAuthEmail(employeeNumber),
      password: pwd,
    });
    return signInError;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!employeeNumber.trim() || !password) {
      setError("Please enter both your employee number and password.");
      return;
    }

    setSubmitting(true);
    try {
      const signInError = await signInWith(password);
      if (!signInError) {
        if (adminMode) {
          const me = await loadProfile();
          if (!me.roles.includes("admin")) {
            await supabase.auth.signOut();
            setError("This account does not have administrator access.");
            return;
          }
          navigate({ to: "/admin", replace: true });
          return;
        }
        navigate({ to: "/home", replace: true });
        return;
      }

      const status = await checkStatus({
        data: { employeeNumber: normalizeEmployeeNumber(employeeNumber) },
      });
      if (status.known && !status.activated) {
        setStep("activate");
        setError(null);
        return;
      }
      setError("Employee number or password is incorrect.");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t("activate.weak"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("activate.mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await activate({
        data: {
          employeeNumber: normalizeEmployeeNumber(employeeNumber),
          dateOfBirth,
          password: newPassword,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const signInError = await signInWith(newPassword);
      if (signInError) {
        setStep("login");
        setError("Account activated. Please sign in with your new password.");
        return;
      }
      navigate({ to: "/home", replace: true });
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className="min-h-screen bg-background">
      <header className="surface-steel px-6 pt-10 pb-16 text-center">
        <div className="mx-auto inline-flex rounded-full bg-primary-foreground/95 p-3.5 shadow-[var(--shadow-lift)]">
          <SailLogo size={72} priority />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-wide">{t("app.org")}</h1>
        <p className="mt-2 text-base text-primary-foreground/85">{t("app.name")}</p>
      </header>

      <div className="mx-auto -mt-10 w-full max-w-md px-4 pb-14">
        {step === "login" ? (
        <section className="card-elevated animate-rise p-6">

          <h2 className="text-2xl font-bold">{t("login.title")}</h2>
          <p className="mt-1 text-base text-muted-foreground">{t("login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label
                htmlFor="employeeNumber"
                className="mb-2 block text-base font-semibold text-foreground"
              >
                {t("login.employeeNumber")}
              </label>
              <div className="relative">
                <User
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="employeeNumber"
                  name="employeeNumber"
                  autoComplete="username"
                  inputMode="text"
                  placeholder={t("login.employeeNumberHint")}
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value.toUpperCase())}
                  className="min-h-14 w-full rounded-xl border border-input bg-background pr-4 pl-12 text-lg tracking-wide text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus-visible:focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-base font-semibold text-foreground"
              >
                {t("login.password")}
              </label>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-input bg-background pr-4 pl-12 text-lg text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus-visible:focus-ring"
                />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-base font-medium text-destructive"
              >
                <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="surface-steel flex min-h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-bold tracking-wide shadow-[var(--shadow-card)] transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("login.submit")
              )}
            </button>

            <button
              type="button"
              className="min-h-12 w-full rounded-xl text-base font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("login.forgot")}
            </button>
          </form>
        </section>
        ) : (
        <section className="card-elevated animate-rise p-6">
          <h2 className="text-2xl font-bold">{t("activate.title")}</h2>
          <p className="mt-1 text-base text-muted-foreground">{t("activate.subtitle")}</p>
          <p className="mt-3 rounded-xl bg-muted p-3 text-base font-semibold tracking-wide">
            {employeeNumber}
          </p>

          <form onSubmit={onActivate} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="dob" className="mb-2 block text-base font-semibold text-foreground">
                {t("activate.dob")}
              </label>
              <div className="relative">
                <CalendarDays
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-input bg-background pr-4 pl-12 text-lg text-foreground focus:border-ring focus:outline-none focus-visible:focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-base font-semibold text-foreground"
              >
                {t("activate.newPassword")}
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-lg text-foreground focus:border-ring focus:outline-none focus-visible:focus-ring"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-base font-semibold text-foreground"
              >
                {t("activate.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-lg text-foreground focus:border-ring focus:outline-none focus-visible:focus-ring"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-base font-medium text-destructive"
              >
                <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="surface-steel flex min-h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-bold tracking-wide shadow-[var(--shadow-card)] transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("activate.submit")
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("login");
                setError(null);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-primary"
            >
              <ArrowLeft aria-hidden className="size-5" />
              {t("activate.back")}
            </button>
          </form>
        </section>
        )}


        <div className="mt-6">
          <LanguageSelector />
        </div>

        <button
          type="button"
          aria-pressed={adminMode}
          onClick={() => {
            setAdminMode((v) => !v);
            setStep("login");
            setError(null);
          }}
          className={`mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border text-base font-semibold ${
            adminMode
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground"
          }`}
        >
          <ShieldCheck aria-hidden className="size-5 text-primary" />
          {adminMode ? t("login.employeeLogin") : t("login.adminLogin")}
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">{t("login.help")}</p>
      </div>
    </main>
  );
}
