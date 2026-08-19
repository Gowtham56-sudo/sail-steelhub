import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily automation endpoint: computes today's birthdays and work anniversaries
 * across the active roster and records them in audit_logs so administrators can
 * see who should be greeted. Protected by a shared CRON_SECRET header — external
 * schedulers must send `x-cron-key`.
 */
export const Route = createFileRoute("/api/public/daily-celebrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        const provided = request.headers.get("x-cron-key") ?? "";
        if (!secret || provided.length !== secret.length || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: roster, error } = await supabaseAdmin
          .from("employees")
          .select("id, employee_number, full_name, department, date_of_birth, date_of_joining")
          .eq("is_active", true);

        if (error) return new Response(error.message, { status: 500 });

        const now = new Date();
        const today = `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
          now.getUTCDate(),
        ).padStart(2, "0")}`;

        const birthdays = (roster ?? []).filter((r) => r.date_of_birth?.slice(5) === today);
        const anniversaries = (roster ?? [])
          .filter((r) => r.date_of_joining?.slice(5) === today)
          .map((r) => ({
            ...r,
            years: now.getUTCFullYear() - Number(r.date_of_joining!.slice(0, 4)),
          }))
          .filter((r) => r.years > 0);

        const rows = [
          ...birthdays.map((r) => ({
            action: "birthday_greeting",
            entity: "employees",
            entity_id: r.id,
            employee_number: r.employee_number,
            details: { name: r.full_name, department: r.department, date: today },
          })),
          ...anniversaries.map((r) => ({
            action: "work_anniversary",
            entity: "employees",
            entity_id: r.id,
            employee_number: r.employee_number,
            details: {
              name: r.full_name,
              department: r.department,
              years: r.years,
              date: today,
            },
          })),
        ];

        if (rows.length > 0) {
          const { error: insertError } = await supabaseAdmin.from("audit_logs").insert(rows);
          if (insertError) return new Response(insertError.message, { status: 500 });
        }

        return Response.json({
          date: today,
          birthdays: birthdays.length,
          anniversaries: anniversaries.length,
        });
      },
    },
  },
});
