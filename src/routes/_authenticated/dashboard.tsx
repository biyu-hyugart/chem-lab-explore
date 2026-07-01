import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Beaker, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ChemXR" },
      { name: "description", content: "Pilih modul praktikum kimia virtual." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

  const modulesQ = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const attemptsQ = useQuery({
    queryKey: ["attempts", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("module_id, completed, score, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completedByModule = new Map<string, { score: number }>();
  attemptsQ.data?.forEach((a) => {
    if (a.completed && !completedByModule.has(a.module_id)) {
      completedByModule.set(a.module_id, { score: a.score });
    }
  });

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Praktikan";

  return (
    <div className="min-h-screen">
      <AppHeader userName={displayName} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pilih modul praktikum untuk mulai bereksperimen di lab virtual.
          </p>
          {completedByModule.size > 0 && modulesQ.data && (
            <p className="mt-1 text-sm text-primary">
              Progres: {completedByModule.size} dari {modulesQ.data.length} modul selesai.
            </p>
          )}
        </div>

        {modulesQ.isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Memuat modul...
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modulesQ.data?.map((m) => {
            const done = completedByModule.get(m.id);
            return (
              <div key={m.id} className="glass-panel flex flex-col p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Beaker className="size-5" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{m.difficulty}</Badge>
                    {done && (
                      <Badge className="bg-accent text-accent-foreground">
                        <CheckCircle2 className="mr-1 size-3" /> Selesai
                      </Badge>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{m.description}</p>
                {done && (
                  <p className="mt-3 text-xs text-primary">Skor terakhir: {done.score}/100</p>
                )}
                <Button asChild className="mt-5">
                  <Link to="/lab/$moduleId" params={{ moduleId: m.id }}>
                    {done ? "Ulangi Praktikum" : "Mulai Praktikum"} <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
