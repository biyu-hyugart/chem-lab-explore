import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react";
import { stateSummary, type BeakerState } from "@/lib/chem-engine";

const searchSchema = z.object({ attemptId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/lab/$moduleId/hasil")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Hasil Praktikum — ChemXR" },
      { name: "description", content: "Hasil, evaluasi, dan skor praktikum kamu." },
    ],
  }),
  component: HasilPage,
});

function HasilPage() {
  const { moduleId } = Route.useParams();
  const { attemptId } = Route.useSearch();
  const { user } = Route.useRouteContext();

  const q = useQuery({
    queryKey: ["hasil", moduleId, attemptId, user.id],
    queryFn: async () => {
      const modP = supabase.from("modules").select("*").eq("id", moduleId).single();
      const attP = attemptId
        ? supabase.from("attempts").select("*").eq("id", attemptId).single()
        : supabase
            .from("attempts")
            .select("*")
            .eq("user_id", user.id)
            .eq("module_id", moduleId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
      const [{ data: mod, error: e1 }, { data: att, error: e2 }] = await Promise.all([modP, attP]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { mod, att };
    },
  });

  if (q.isLoading || !q.data) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Memuat hasil...
        </div>
      </div>
    );
  }
  const { mod, att } = q.data;
  const logs = (att.steps_log as { stepId: string; ok: boolean; message: string }[]) ?? [];
  const okCount = logs.filter((l) => l.ok).length;
  const target = mod.target as { solute?: string; molarity?: number; volume_ml?: number };
  const final = att.final_state as BeakerState | null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="mr-1 size-4" /> Kembali ke Dashboard</Link>
        </Button>

        <div className="glass-panel p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Hasil praktikum</p>
              <h1 className="font-display text-3xl font-bold">{mod.title}</h1>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-primary">
                <Trophy className="size-5" />
                <span className="font-display text-4xl font-bold">{att.score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
              {att.completed ? (
                <Badge className="mt-1 bg-accent text-accent-foreground">Modul selesai</Badge>
              ) : (
                <Badge variant="outline" className="mt-1">Belum lengkap</Badge>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-primary">Target</p>
              <p className="mt-2 text-sm">
                Membuat larutan <strong>{target.solute?.toUpperCase()}</strong>{" "}
                {target.molarity} M sebanyak {target.volume_ml} mL.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-primary">Hasil akhir kamu</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {final ? stateSummary(final) : "Tidak ada data."}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Evaluasi Langkah</h2>
            <div className="space-y-2">
              {logs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada aksi yang dicatat.</p>}
              {logs.map((l, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                    l.ok ? "border-accent/40 bg-accent/5" : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  {l.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{l.stepId}</p>
                    <p className="text-muted-foreground">{l.message}</p>
                  </div>
                </div>
              ))}
              <p className="pt-2 text-sm text-muted-foreground">
                {okCount} dari {logs.length} aksi dilakukan dengan benar.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-primary/10 p-4 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wider text-primary">Pembelajaran</p>
            <p>{mod.theory}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/lab/$moduleId" params={{ moduleId }}>Ulangi Praktikum</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Modul lain</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
