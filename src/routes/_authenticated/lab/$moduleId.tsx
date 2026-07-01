import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { LabScene } from "@/components/lab/LabScene";
import { ChemAssistant } from "@/components/lab/ChemAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  EMPTY_BEAKER,
  REAGENTS,
  addReagent,
  evaluateStep,
  record,
  stir,
  stateSummary,
  type ReagentId,
  type Step,
} from "@/lib/chem-engine";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FlaskConical, ListChecks, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lab/$moduleId")({
  head: ({ params }) => ({
    meta: [
      { title: `Praktikum ${params.moduleId} — ChemXR` },
      { name: "description", content: "Lab kimia virtual dengan simulasi 3D dan asisten AI." },
    ],
  }),
  component: LabPage,
});

interface LogEntry {
  stepId: string;
  ok: boolean;
  message: string;
  at: string;
}

function LabPage() {
  const { moduleId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const moduleQ = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("id", moduleId).single();
      if (error) throw error;
      return data;
    },
  });

  const [beaker, setBeaker] = useState(EMPTY_BEAKER);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [pendingReagent, setPendingReagent] = useState<ReagentId | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const steps: Step[] = useMemo(() => (moduleQ.data?.steps as Step[]) ?? [], [moduleQ.data]);
  const currentStep = steps[completedStepIds.length];
  const finished = currentStep === undefined && steps.length > 0;

  const handleAction = (
    action:
      | { type: "add"; reagent: ReagentId; amount: number }
      | { type: "stir" }
      | { type: "record" },
  ) => {
    if (!currentStep) return;
    const result = evaluateStep(currentStep, action, beaker, completedStepIds);
    let newState = beaker;
    if (action.type === "add") newState = addReagent(beaker, action.reagent, action.amount);
    else if (action.type === "stir") newState = stir(beaker);
    else if (action.type === "record") newState = record(beaker);
    setBeaker(newState);

    setLogs((l) => [
      ...l,
      { stepId: currentStep.id, ok: result.ok, message: result.message, at: new Date().toISOString() },
    ]);
    if (result.ok) {
      setCompletedStepIds((ids) => [...ids, currentStep.id]);
      toast.success(`Langkah "${currentStep.label}" berhasil`);
    } else {
      toast.error(result.message);
    }
  };

  const submitReagent = () => {
    if (!pendingReagent || pendingAmount <= 0) return;
    handleAction({ type: "add", reagent: pendingReagent, amount: pendingAmount });
    setPendingReagent(null);
    setPendingAmount(0);
  };

  const finishPraktikum = async () => {
    setSaving(true);
    const successCount = logs.filter((l) => l.ok).length;
    const totalActions = logs.length || 1;
    const stepBonus = steps.length ? (completedStepIds.length / steps.length) * 60 : 0;
    const accuracyBonus = (successCount / totalActions) * 40;
    const score = Math.round(stepBonus + accuracyBonus);

    const { data, error } = await supabase
      .from("attempts")
      .insert({
        user_id: user.id,
        module_id: moduleId,
        score,
        steps_log: logs,
        final_state: beaker,
        completed: completedStepIds.length === steps.length,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error("Gagal menyimpan hasil");
      return;
    }
    navigate({ to: "/lab/$moduleId/hasil", params: { moduleId }, search: { attemptId: data.id } });
  };

  if (moduleQ.isLoading || !moduleQ.data) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Memuat modul...
        </div>
      </div>
    );
  }
  const mod = moduleQ.data;
  const materials = (mod.materials as string[]) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="border-b border-border bg-card/40 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="mr-1 size-4" /> Dashboard</Link>
            </Button>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight">{mod.title}</h1>
              <p className="text-xs text-muted-foreground">{mod.objective}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              Langkah {Math.min(completedStepIds.length + 1, steps.length)} / {steps.length}
            </Badge>
            <Button onClick={finishPraktikum} disabled={saving || logs.length === 0}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Selesai & Lihat Hasil
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr_320px]">
        {/* LEFT: petunjuk & langkah */}
        <aside className="space-y-4">
          <Tabs defaultValue="steps">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="steps"><ListChecks className="mr-1 size-4" /> Langkah</TabsTrigger>
              <TabsTrigger value="info">Petunjuk</TabsTrigger>
            </TabsList>
            <TabsContent value="steps" className="mt-3 space-y-2">
              {steps.map((s, i) => {
                const done = completedStepIds.includes(s.id);
                const active = currentStep?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`glass-panel p-3 text-sm ${active ? "ring-1 ring-primary" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${
                          done ? "bg-accent text-accent-foreground" : "bg-secondary"
                        }`}
                      >
                        {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                      </div>
                      <p className={done ? "text-muted-foreground line-through" : ""}>{s.label}</p>
                    </div>
                  </div>
                );
              })}
              {finished && (
                <div className="glass-panel p-3 text-sm text-accent">
                  Semua langkah selesai! Klik "Selesai & Lihat Hasil" di atas.
                </div>
              )}
            </TabsContent>
            <TabsContent value="info" className="mt-3 space-y-3 text-sm">
              <div className="glass-panel p-4">
                <p className="mb-1 text-xs uppercase tracking-wider text-primary">Teori</p>
                <p className="text-muted-foreground">{mod.theory}</p>
              </div>
              <div className="glass-panel p-4">
                <p className="mb-1 text-xs uppercase tracking-wider text-primary">Alat & Bahan</p>
                <ul className="list-disc pl-4 text-muted-foreground">
                  {materials.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* CENTER: 3D scene + panel aksi */}
        <section className="flex flex-col gap-4">
          <div className="glass-panel h-[420px] overflow-hidden">
            <LabScene state={beaker} />
          </div>
          <div className="glass-panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" />
              <p className="text-sm font-semibold">Aksi</p>
            </div>
            <div className="mb-3 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
              {stateSummary(beaker)}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {(Object.keys(REAGENTS) as ReagentId[]).map((id) => (
                <Button
                  key={id}
                  variant={pendingReagent === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPendingReagent(id);
                    setPendingAmount(REAGENTS[id].defaultAmount);
                  }}
                  disabled={finished}
                >
                  <span
                    className="mr-2 inline-block size-3 rounded-full"
                    style={{ background: REAGENTS[id].color }}
                  />
                  {REAGENTS[id].name}
                </Button>
              ))}
            </div>
            {pendingReagent && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Jumlah ({REAGENTS[pendingReagent].unit})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pendingAmount}
                    onChange={(e) => setPendingAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button onClick={submitReagent}>Tambahkan</Button>
                <Button variant="ghost" onClick={() => setPendingReagent(null)}>Batal</Button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleAction({ type: "stir" })} disabled={finished}>
                Aduk
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleAction({ type: "record" })} disabled={finished}>
                Catat Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBeaker(EMPTY_BEAKER);
                  setLogs([]);
                  setCompletedStepIds([]);
                }}
                disabled={finished}
              >
                Kosongkan Gelas
              </Button>
            </div>
          </div>
        </section>

        {/* RIGHT: AI Asisten */}
        <aside className="lg:h-[calc(100vh-9rem)] lg:sticky lg:top-20">
          <div className="h-[500px] lg:h-full">
            <ChemAssistant
              context={{
                moduleTitle: mod.title,
                objective: mod.objective,
                theory: mod.theory,
                currentStep: currentStep?.label ?? "praktikum sudah selesai",
                stepsCompleted: completedStepIds,
                stateSummary: stateSummary(beaker),
              }}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
