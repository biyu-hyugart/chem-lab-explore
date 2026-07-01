// Engine simulasi larutan sederhana untuk ChemXR.
// Tidak fisis akurat 100% — cukup untuk edukasi dasar.

export type ReagentId = "nacl" | "water" | "hcl" | "naoh" | "pp";

export interface Reagent {
  id: ReagentId;
  name: string;
  color: string; // css color untuk visual gelas
  unit: "g" | "mL" | "tetes";
  defaultAmount: number;
}

export const REAGENTS: Record<ReagentId, Reagent> = {
  water: { id: "water", name: "Akuades (H₂O)", color: "#7dd3fc", unit: "mL", defaultAmount: 25 },
  nacl: { id: "nacl", name: "NaCl (padatan)", color: "#e2e8f0", unit: "g", defaultAmount: 0.585 },
  hcl: { id: "hcl", name: "HCl 1 M", color: "#fef3c7", unit: "mL", defaultAmount: 10 },
  naoh: { id: "naoh", name: "NaOH 0,1 M", color: "#dbeafe", unit: "mL", defaultAmount: 1 },
  pp: { id: "pp", name: "Fenolftalein", color: "#f9a8d4", unit: "tetes", defaultAmount: 3 },
};

export interface BeakerState {
  contents: Partial<Record<ReagentId, number>>; // mengambil unit default per reagen
  totalVolumeMl: number;
  color: string;
  stirred: boolean;
  recorded: boolean;
  addOrder: ReagentId[]; // urutan penambahan (penting untuk asam-basa)
}

export const EMPTY_BEAKER: BeakerState = {
  contents: {},
  totalVolumeMl: 0,
  color: "#0ea5e910",
  stirred: false,
  recorded: false,
  addOrder: [],
};

function mixColors(a: string, b: string, ratio: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r * (1 - ratio) + pb.r * ratio);
  const g = Math.round(pa.g * (1 - ratio) + pb.g * ratio);
  const bl = Math.round(pa.b * (1 - ratio) + pb.b * ratio);
  return `rgb(${r}, ${g}, ${bl})`;
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function addReagent(state: BeakerState, id: ReagentId, amount: number): BeakerState {
  const contents = { ...state.contents };
  contents[id] = (contents[id] ?? 0) + amount;
  const reagent = REAGENTS[id];
  let vol = state.totalVolumeMl;
  if (reagent.unit === "mL") vol += amount;
  // approximate color mixing
  let color = state.color;
  if (reagent.unit !== "g") {
    const ratio = Math.min(0.5, amount / Math.max(20, vol));
    color = state.totalVolumeMl === 0 ? reagent.color : mixColors(color, reagent.color, ratio);
  }
  // titrasi: indikator PP + basa berlebih → merah muda
  const hasIndicator = (contents.pp ?? 0) > 0;
  const hclMol = ((contents.hcl ?? 0) / 1000) * 1; // HCl 1M
  const naohMol = ((contents.naoh ?? 0) / 1000) * 0.1; // NaOH 0.1M
  if (hasIndicator && naohMol > hclMol && hclMol > 0) {
    color = "#f472b6";
  }
  return {
    ...state,
    contents,
    totalVolumeMl: vol,
    color,
    addOrder: [...state.addOrder, id],
  };
}

export function stir(state: BeakerState): BeakerState {
  return { ...state, stirred: true };
}

export function record(state: BeakerState): BeakerState {
  return { ...state, recorded: true };
}

export function stateSummary(s: BeakerState): string {
  const parts = Object.entries(s.contents)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => {
      const r = REAGENTS[k as ReagentId];
      return `${v!.toFixed(2)} ${r.unit} ${r.name}`;
    });
  if (parts.length === 0) return "wadah masih kosong";
  return `${parts.join(", ")}. Volume total ~${s.totalVolumeMl.toFixed(1)} mL. ${
    s.stirred ? "Sudah diaduk." : "Belum diaduk."
  }`;
}

// Evaluasi apakah aksi memenuhi ekspektasi langkah tertentu
export interface StepExpect {
  reagent?: ReagentId;
  amount?: number;
  total?: number;
  tolerance?: number;
  action?: "stir" | "record";
  requires?: string[];
}
export interface Step {
  id: string;
  label: string;
  expect: StepExpect;
}

export function evaluateStep(
  step: Step,
  action: { type: "add"; reagent: ReagentId; amount: number } | { type: "stir" } | { type: "record" },
  state: BeakerState,
  completedIds: string[],
): { ok: boolean; message: string } {
  const e = step.expect;
  if (e.requires && !e.requires.every((r) => completedIds.includes(r))) {
    return { ok: false, message: `Langkah sebelumnya (${e.requires.join(", ")}) belum selesai.` };
  }
  if (e.action === "stir") {
    return action.type === "stir"
      ? { ok: true, message: "Larutan diaduk." }
      : { ok: false, message: "Langkah ini mengharapkan pengadukan." };
  }
  if (e.action === "record") {
    return action.type === "record"
      ? { ok: true, message: "Data dicatat." }
      : { ok: false, message: "Langkah ini mengharapkan pencatatan." };
  }
  if (action.type !== "add") return { ok: false, message: "Aksi tidak sesuai." };
  if (e.reagent && action.reagent !== e.reagent) {
    return { ok: false, message: `Reagen yang diharapkan: ${REAGENTS[e.reagent].name}.` };
  }
  const tol = e.tolerance ?? 0.5;
  if (e.total !== undefined) {
    const nextTotal =
      state.totalVolumeMl + (REAGENTS[action.reagent].unit === "mL" ? action.amount : 0);
    if (Math.abs(nextTotal - e.total) > tol) {
      return { ok: false, message: `Volume total seharusnya ~${e.total} mL (±${tol}).` };
    }
  } else if (e.amount !== undefined) {
    if (Math.abs(action.amount - e.amount) > tol) {
      return {
        ok: false,
        message: `Jumlah seharusnya ~${e.amount} ${REAGENTS[action.reagent].unit} (±${tol}).`,
      };
    }
  }
  return { ok: true, message: "Langkah dilakukan dengan benar." };
}
