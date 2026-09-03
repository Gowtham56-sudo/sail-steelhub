import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Search, Plus, Eye, EyeOff, Cake, PartyPopper, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getAdminOverview,
  adminListEmployees,
  adminSaveEmployee,
  adminSetEmployeeFlags,
  adminListContent,
  adminSetPublished,
  adminCreateCircular,
  adminGetCelebrations,
  adminRunCelebrations,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content:
          "Manage the Salem Steel Plant employee roster, learning content, events, circulars and audit logs.",
      },
      { property: "og:title", content: "Admin Panel — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Role-based administration for the Salem Steel Plant employee knowledge hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "employees" | "content" | "greetings" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "content", label: "Content" },
  { id: "greetings", label: "Greetings" },
  { id: "audit", label: "Audit" },
];

const inputClass =
  "min-h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <AppShell title="Admin Panel">
      <div className="card-elevated flex items-center gap-3 p-4">
        <ShieldCheck aria-hidden className="size-7 text-accent" />
        <p className="text-base font-semibold">Administrator tools — all actions are logged.</p>
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-4 grid grid-cols-5 gap-1 rounded-xl bg-muted p-1"
      >
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`min-h-12 rounded-lg text-sm font-bold ${
              tab === x.id ? "bg-card text-primary shadow" : "text-muted-foreground"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "overview" ? <OverviewTab /> : null}
        {tab === "employees" ? <EmployeesTab /> : null}
        {tab === "content" ? <ContentTab /> : null}
        {tab === "greetings" ? <GreetingsTab /> : null}
        {tab === "audit" ? <AuditTab /> : null}
      </div>
    </AppShell>
  );
}

function Spinner() {
  return (
    <p className="flex items-center gap-2 text-lg text-muted-foreground">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      Loading…
    </p>
  );
}

function useOverview() {
  const fn = useServerFn(getAdminOverview);
  return useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
}

function OverviewTab() {
  const { data, isPending, error } = useOverview();
  if (isPending) return <Spinner />;
  if (error) return <p className="text-lg text-destructive">You do not have admin access.</p>;

  const s = data!.stats;
  const cards = [
    { label: "Employees on roster", value: s.employees },
    { label: "Accounts activated", value: s.activated },
    { label: "Learning modules", value: s.modules },
    { label: "Quiz attempts", value: s.attempts },
    { label: "Events", value: s.events },
    { label: "Circulars", value: s.circulars },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card-elevated p-4">
          <p className="text-3xl font-bold text-primary">{c.value}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

const EMPTY_EMPLOYEE = {
  id: undefined as string | undefined,
  employee_number: "",
  full_name: "",
  designation: "",
  department: "",
  date_of_birth: "",
  date_of_joining: "",
  work_email: "",
  phone: "",
};

function EmployeesTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListEmployees);
  const save = useServerFn(adminSaveEmployee);
  const setFlags = useServerFn(adminSetEmployeeFlags);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<typeof EMPTY_EMPLOYEE | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-employees", search],
    queryFn: () => list({ data: { search } }),
  });

  const saveMutation = useMutation({
    mutationFn: (values: typeof EMPTY_EMPLOYEE) => save({ data: values }),
    onSuccess: () => {
      setForm(null);
      setMessage("Employee saved.");
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const flagMutation = useMutation({
    mutationFn: (v: { id: string; is_active?: boolean; is_admin?: boolean }) =>
      setFlags({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-employees"] }),
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <div>
      <label className="relative block">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number, name or department"
          aria-label="Search employees"
          className={`${inputClass} pl-11`}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setForm({ ...EMPTY_EMPLOYEE });
        }}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        <Plus aria-hidden className="size-5" /> Add employee
      </button>

      {message ? <p className="mt-3 text-base font-semibold text-accent">{message}</p> : null}

      {form ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <h2 className="text-xl font-bold">{form.id ? "Edit employee" : "New employee"}</h2>
          {(
            [
              ["employee_number", "Employee number", "text"],
              ["full_name", "Full name", "text"],
              ["designation", "Designation", "text"],
              ["department", "Department", "text"],
              ["date_of_birth", "Date of birth", "date"],
              ["date_of_joining", "Date of joining", "date"],
              ["work_email", "Work email", "email"],
              ["phone", "Phone", "tel"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <input
                type={type}
                value={(form as Record<string, string>)[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === "employee_number" || key === "full_name"}
                className={inputClass}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="min-h-14 flex-1 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="min-h-14 flex-1 rounded-xl border-2 border-border text-lg font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {(data?.employees ?? []).map((e) => (
            <li key={e.id} className="card-elevated p-4">
              <p className="text-lg font-bold">{e.full_name}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {e.employee_number} · {e.designation ?? "—"} · {e.department ?? "—"}
              </p>
              <p className="mt-1 text-sm">
                {e.auth_user_id ? "Activated" : "Not activated"} ·{" "}
                {e.is_active ? "Active" : "Inactive"} · {e.is_admin ? "Admin" : "Employee"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setForm({
                      id: e.id,
                      employee_number: e.employee_number,
                      full_name: e.full_name,
                      designation: e.designation ?? "",
                      department: e.department ?? "",
                      date_of_birth: e.date_of_birth ?? "",
                      date_of_joining: e.date_of_joining ?? "",
                      work_email: e.work_email ?? "",
                      phone: e.phone ?? "",
                    });
                  }}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => flagMutation.mutate({ id: e.id, is_active: !e.is_active })}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  {e.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => flagMutation.mutate({ id: e.id, is_admin: !e.is_admin })}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  {e.is_admin ? "Remove admin" : "Make admin"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CIRCULAR_FORM = {
  circular_number: "",
  title: "",
  summary: "",
  body: "",
  category: "General",
  department: "",
  issued_date: new Date().toISOString().slice(0, 10),
};

function ContentTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListContent);
  const publishFn = useServerFn(adminSetPublished);
  const createFn = useServerFn(adminCreateCircular);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...CIRCULAR_FORM });
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => listFn(),
  });

  const publish = useMutation({
    mutationFn: (v: {
      table: "circulars" | "events" | "learning_modules";
      id: string;
      is_published: boolean;
    }) => publishFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-content"] }),
  });

  const create = useMutation({
    mutationFn: (v: typeof CIRCULAR_FORM) => createFn({ data: v }),
    onSuccess: () => {
      setShowForm(false);
      setForm({ ...CIRCULAR_FORM });
      setMessage("Circular published.");
      qc.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  function Group({
    title,
    table,
    rows,
  }: {
    title: string;
    table: "circulars" | "events" | "learning_modules";
    rows: { id: string; title: string; is_published: boolean; category?: string | null }[];
  }) {
    return (
      <section className="mt-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card-elevated flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{r.title}</p>
                <p className="text-sm text-muted-foreground">
                  {r.category ?? "—"} · {r.is_published ? "Published" : "Draft"}
                </p>
              </div>
              <button
                type="button"
                aria-label={r.is_published ? `Unpublish ${r.title}` : `Publish ${r.title}`}
                onClick={() => publish.mutate({ table, id: r.id, is_published: !r.is_published })}
                className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-border"
              >
                {r.is_published ? (
                  <Eye aria-hidden className="size-5 text-primary" />
                ) : (
                  <EyeOff aria-hidden className="size-5 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (isPending) return <Spinner />;

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        <Plus aria-hidden className="size-5" /> New circular
      </button>
      {message ? <p className="mt-3 text-base font-semibold text-accent">{message}</p> : null}

      {showForm ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form);
          }}
        >
          {(
            [
              ["circular_number", "Circular number", "text"],
              ["title", "Title", "text"],
              ["category", "Category", "text"],
              ["department", "Department", "text"],
              ["issued_date", "Issued date", "date"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key !== "department"}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Summary</span>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={2}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Full text</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="min-h-14 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground"
          >
            {create.isPending ? "Publishing…" : "Publish circular"}
          </button>
        </form>
      ) : null}

      <Group
        title="Circulars"
        table="circulars"
        rows={(data?.circulars ?? []).map((c) => ({
          id: c.id,
          title: `${c.circular_number} — ${c.title}`,
          is_published: c.is_published,
          category: c.category,
        }))}
      />
      <Group
        title="Events"
        table="events"
        rows={(data?.events ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          is_published: e.is_published,
          category: e.category,
        }))}
      />
      <Group
        title="Learning modules"
        table="learning_modules"
        rows={(data?.modules ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          is_published: m.is_published,
          category: m.category,
        }))}
      />
    </div>
  );
}

function GreetingsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminGetCelebrations);
  const runFn = useServerFn(adminRunCelebrations);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-greetings"],
    queryFn: () => listFn(),
  });

  const run = useMutation({
    mutationFn: () => runFn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-greetings"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => run.mutate()}
        disabled={run.isPending}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        {run.isPending ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : (
          <Play aria-hidden className="size-5" />
        )}
        Run today's greeting scan now
      </button>
      <p className="mt-2 text-sm text-muted-foreground">
        The backend also runs this automatically every day at 9:00 AM India time.
      </p>
      {run.data ? (
        <p className="mt-2 text-base font-semibold text-accent">
          Scan complete — {run.data.inserted} greeting{run.data.inserted === 1 ? "" : "s"} recorded
          for today.
        </p>
      ) : null}
      {run.error ? (
        <p className="mt-2 text-base font-semibold text-destructive">{run.error.message}</p>
      ) : null}

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-lg text-destructive">You do not have admin access.</p>
      ) : !data!.greetings.length ? (
        <p className="mt-4 text-lg text-muted-foreground">
          No greetings recorded yet. Use the button above or wait for the daily 9:00 AM scan.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data!.greetings.map((g) => {
            const d =
              g.details && typeof g.details === "object" && !Array.isArray(g.details)
                ? (g.details as Record<string, unknown>)
                : {};
            const isBirthday = g.action === "birthday_greeting";
            return (
              <li key={g.id} className="card-elevated flex items-center gap-3 p-4">
                {isBirthday ? (
                  <Cake aria-hidden className="size-7 shrink-0 text-accent" />
                ) : (
                  <PartyPopper aria-hidden className="size-7 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">
                    {typeof d.name === "string" ? d.name : (g.employee_number ?? "Employee")}
                    {typeof d.years === "number" ? ` — ${d.years} years` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isBirthday ? "Birthday" : "Work anniversary"}
                    {typeof d.department === "string" ? ` · ${d.department}` : ""} ·{" "}
                    {new Date(g.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AuditTab() {
  const { data, isPending, error } = useOverview();
  if (isPending) return <Spinner />;
  if (error) return <p className="text-lg text-destructive">You do not have admin access.</p>;

  const logs = data!.logs;
  if (!logs.length) return <p className="text-lg text-muted-foreground">No activity yet.</p>;

  return (
    <ul className="space-y-3">
      {logs.map((l) => (
        <li key={l.id} className="card-elevated p-4">
          <p className="text-base font-bold">{l.action}</p>
          <p className="text-sm text-muted-foreground">
            {l.entity ?? "—"} · {new Date(l.created_at).toLocaleString()}
          </p>
          <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
            {JSON.stringify(l.details)}
          </pre>
        </li>
      ))}
    </ul>
  );
}
