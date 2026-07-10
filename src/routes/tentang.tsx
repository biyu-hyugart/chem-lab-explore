import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Atom,
  Cpu,
  GitBranch,
  Sparkles,
  Target,
  Users,
  FlaskConical,
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Gauge,
} from "lucide-react";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang ChemXR — Novelty, Arsitektur, & Validasi" },
      {
        name: "description",
        content:
          "Kontribusi Reaction Engine ChemXR, arsitektur sistem, alur pengguna, rencana validasi SUS/UEQ dan pretest-posttest, serta indikator dampak untuk pembelajaran kimia.",
      },
      { property: "og:title", content: "Tentang ChemXR — Novelty, Arsitektur, & Validasi" },
      {
        property: "og:description",
        content:
          "Bagaimana Reaction Engine ChemXR bekerja, arsitektur teknis, rencana validasi kuantitatif, dan target dampak pembelajaran.",
      },
    ],
  }),
  component: TentangPage,
});

function TentangPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary glow-primary">
            <Atom className="size-5" />
          </div>
          <span className="font-display text-xl font-semibold">ChemXR</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground">Beranda</Link>
          <Link to="/tentang" className="text-foreground">Tentang</Link>
        </nav>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Masuk</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Coba Sekarang</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <section className="py-14 md:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Dokumen teknis & metodologi
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Novelty, arsitektur, dan rencana validasi ChemXR
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            ChemXR bukan sekadar integrasi AI ke laboratorium virtual. Halaman ini
            merangkum kontribusi unik <strong>Reaction Engine</strong>, arsitektur
            sistem, alur pengguna, rencana validasi kuantitatif, serta target
            dampak untuk pembelajaran kimia di Indonesia.
          </p>
        </section>

        {/* 1. Novelty */}
        <Section
          icon={FlaskConical}
          kicker="1 · Novelty"
          title="Kontribusi unik: Reaction Engine adaptif"
          lead="Perbedaan mendasar ChemXR dari PhET, ChemCollective, maupun Labster tidak berhenti pada 'ada AI-nya'. Kebaruan kami terletak pada mesin reaksi berbasis aturan (rule-based reaction engine) yang berjalan real-time di browser dan dipadukan dengan lapisan pedagogis berbasis LLM."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <NoveltyCard
              title="Rule-based reaction inference"
              points={[
                "Setiap penambahan reagen memicu detectReaction() yang mencocokkan komposisi wadah dengan daftar aturan reaksi (dissolve, fizz, neutralize, indicator, precipitate).",
                "Aturan disimpan sebagai data — bukan kode keras — sehingga guru dapat menambah reaksi baru tanpa mengubah engine.",
                "Setiap reaksi menghasilkan profile efek (bubbles, steam, flash, warna) yang menurun secara eksponensial selama 2,5 detik untuk mensimulasikan kinetika sederhana.",
              ]}
            />
            <NoveltyCard
              title="State-aware AI tutor"
              points={[
                "LLM (Gemini via Lovable AI Gateway) menerima konteks langsung dari BeakerState: reagen, volume, urutan penambahan, apakah sudah diaduk.",
                "Prompt dibatasi peran 'asisten sabar' — memberi petunjuk berjenjang, bukan jawaban langsung — sehingga menjaga zona pembelajaran aktif.",
                "Deteksi kesalahan urutan (mis. asam ke air vs sebaliknya) dilakukan di engine, lalu AI menjelaskan mengapa itu berbahaya.",
              ]}
            />
            <NoveltyCard
              title="Deterministic + adaptive"
              points={[
                "Perhitungan molaritas, pH sederhana, dan titik ekivalen dilakukan deterministik oleh chem-engine.ts — bukan halusinasi LLM — sehingga hasil selalu konsisten.",
                "Lapisan LLM hanya menerjemahkan hasil deterministik menjadi penjelasan bahasa alami yang sesuai level siswa.",
                "Arsitektur dual-layer ini yang membedakan ChemXR: presisi mesin fisika + fleksibilitas dialog AI.",
              ]}
            />
            <NoveltyCard
              title="Zero-install, low-bandwidth"
              points={[
                "Berjalan penuh di browser dengan Three.js + React Three Fiber — tanpa unduhan seperti Labster.",
                "Aset 3D dibangun dari primitive geometry (silinder, kerucut) — total < 500 KB, ramah jaringan sekolah.",
                "Cocok untuk konteks Indonesia: laboratorium terbatas, perangkat sederhana, internet tidak selalu stabil.",
              ]}
            />
          </div>

          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 text-sm">
            <p className="font-semibold text-primary">Pembanding singkat</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">Aspek</th>
                    <th className="py-2 pr-3">PhET</th>
                    <th className="py-2 pr-3">ChemCollective</th>
                    <th className="py-2 pr-3">Labster</th>
                    <th className="py-2 pr-3 text-primary">ChemXR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Reaction engine adaptif", "—", "Terbatas", "Skenario tetap", "✓ rule-based"],
                    ["AI tutor state-aware", "—", "—", "Terbatas", "✓ konteks larutan"],
                    ["Bahasa Indonesia native", "Sebagian", "—", "—", "✓ penuh"],
                    ["Bisa diperluas guru", "—", "Ya", "—", "✓ data-driven"],
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {r.map((c, j) => (
                        <td key={j} className={`py-2 pr-3 ${j === 4 ? "text-primary" : ""}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* 2. Arsitektur */}
        <Section
          icon={Layers}
          kicker="2 · Arsitektur sistem"
          title="Bagaimana ChemXR bekerja secara teknis"
          lead="Sistem terbagi menjadi tiga lapisan: presentasi 3D di browser, lapisan simulasi deterministik, dan lapisan AI yang berjalan di edge function."
        >
          <div className="glass-panel overflow-hidden p-6">
            <ArchitectureDiagram />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <LayerCard
              n="A"
              title="Presentation Layer"
              tech="React 19 · Three.js · R3F · Tailwind"
              desc="Meja lab 3D, botol reagen, gelas kimia, animasi bubbles/steam/flash. Menerima aksi user dan menampilkan efek visual dari engine."
            />
            <LayerCard
              n="B"
              title="Simulation Layer"
              tech="chem-engine.ts (pure TS)"
              desc="BeakerState, addReagent(), stir(), evaluateStep(), detectReaction(). Deterministik, dapat diuji, dan menjadi single source of truth."
            />
            <LayerCard
              n="C"
              title="AI Layer"
              tech="TanStack Server Fn · Gemini · Lovable AI"
              desc="Streaming chat, menerima context {moduleTitle, currentStep, stateSummary}. System prompt membatasi peran sebagai tutor Bahasa Indonesia."
            />
          </div>
        </Section>

        {/* 3. Alur pengguna */}
        <Section
          icon={GitBranch}
          kicker="3 · Alur pengguna"
          title="User flow praktikum virtual"
          lead="Dirancang mengikuti siklus pembelajaran eksperiensial: baca → coba → refleksi → evaluasi."
        >
          <div className="glass-panel p-6">
            <UserFlowDiagram />
          </div>
        </Section>

        {/* 4. Validasi */}
        <Section
          icon={Gauge}
          kicker="4 · Rencana validasi kuantitatif"
          title="Metodologi & target metrik"
          lead="Validasi dirancang dengan pendekatan mixed-method: usability (SUS + UEQ) dan efektivitas belajar (pretest–posttest berdesain quasi-experimental)."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              icon={Users}
              label="Responden target"
              value="60"
              unit="siswa"
              note="2 kelas SMA XI IPA · 1 kelas kontrol, 1 kelas eksperimen · plus 6 guru kimia untuk expert review"
            />
            <MetricCard
              icon={Gauge}
              label="Target SUS"
              value="≥ 75"
              unit="/100"
              note="System Usability Scale — di atas rata-rata industri (68). Diukur setelah 3 sesi penggunaan."
            />
            <MetricCard
              icon={Sparkles}
              label="Target UEQ"
              value="≥ 1,5"
              unit="skala −3..+3"
              note="User Experience Questionnaire pada dimensi attractiveness, novelty, dan stimulation."
            />
            <MetricCard
              icon={TrendingUp}
              label="Peningkatan hasil belajar"
              value="≥ 25%"
              unit="gain score"
              note="Normalized gain <g> Hake pada tes konsep larutan dan stoikiometri (10 soal, r ≥ 0,7)."
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="glass-panel p-6">
              <h3 className="font-display text-lg font-semibold">Instrumen</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Kuesioner SUS 10 item (skala Likert 5).",
                  "UEQ short-form 8 item — bipolar semantic differential.",
                  "Pretest & posttest paralel — 10 soal pilihan ganda + 2 esai, divalidasi 2 ahli materi.",
                  "Log interaksi otomatis: waktu per langkah, jumlah kesalahan, penggunaan AI hint.",
                  "Wawancara semi-terstruktur pada 6 siswa (purposive: 2 tinggi, 2 sedang, 2 rendah).",
                ].map((i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-panel p-6">
              <h3 className="font-display text-lg font-semibold">Analisis</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Uji normalitas Shapiro-Wilk pada skor pretest & posttest.",
                  "Uji-t berpasangan (paired t-test) untuk selisih pre-post dalam kelas eksperimen.",
                  "Uji-t independen antara kelas kontrol & eksperimen pada gain score.",
                  "Effect size Cohen's d — target d ≥ 0,5 (efek sedang).",
                  "Analisis kualitatif tematik pada transkrip wawancara & log AI.",
                ].map((i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status data saat ini:</strong>{" "}
              instrumen telah disusun dan validasi ahli sedang berjalan. Pilot
              terbatas (n = 8 mahasiswa) menunjukkan waktu penyelesaian modul rata-rata
              12 menit dan tidak ada kegagalan sistem. Uji lapangan penuh dijadwalkan
              pada semester berikutnya.
            </p>
          </div>
        </Section>

        {/* 5. Dampak */}
        <Section
          icon={Target}
          kicker="5 · Target dampak"
          title="Indikator keberhasilan implementasi"
          lead="Dampak diukur pada tiga tingkat: siswa (pemahaman), guru (adopsi), dan sistem (skalabilitas)."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <ImpactCard
              icon={BookOpen}
              level="Siswa"
              targets={[
                "≥ 80% menyelesaikan minimal 3 modul",
                "Gain score ternormalisasi ≥ 0,3",
                "≥ 70% menyatakan lebih percaya diri untuk lab riil",
              ]}
            />
            <ImpactCard
              icon={Users}
              level="Guru"
              targets={[
                "5 guru mitra pada tahun pertama",
                "≥ 3 modul dikontribusikan oleh guru",
                "Waktu persiapan lab berkurang ≥ 40%",
              ]}
            />
            <ImpactCard
              icon={Cpu}
              level="Sistem"
              targets={[
                "Uptime ≥ 99,5%",
                "Time-to-interactive ≤ 3 detik pada 3G lambat",
                "Biaya AI per sesi ≤ Rp 500",
              ]}
            />
          </div>
        </Section>

        {/* CTA */}
        <section className="mt-16 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-10 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Coba sendiri Reaction Engine-nya
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Semua yang dijelaskan di halaman ini sudah berjalan di aplikasi. Masuk
            dan jalankan modul titrasi untuk melihat reaksi netralisasi secara langsung.
          </p>
          <Button size="lg" asChild className="mt-6 glow-primary">
            <Link to="/auth">
              Mulai Praktikum <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ChemXR — Laboratorium Kimia Virtual.
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({
  icon: Icon,
  kicker,
  title,
  lead,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 scroll-mt-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-5" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {kicker}
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">{lead}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function NoveltyCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LayerCard({ n, title, tech, desc }: { n: string; title: string; tech: string; desc: string }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-accent/20 font-display text-sm font-bold text-accent">
          {n}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-xs text-primary">{tech}</p>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function ImpactCard({
  icon: Icon,
  level,
  targets,
}: {
  icon: React.ComponentType<{ className?: string }>;
  level: string;
  targets: string[];
}) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
          <Icon className="size-4" />
        </div>
        <h3 className="font-display text-lg font-semibold">{level}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {targets.map((t) => (
          <li key={t} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- diagrams (inline SVG) ---------- */

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
        </linearGradient>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      {/* Browser layer */}
      <rect x="20" y="20" width="760" height="120" rx="12" fill="url(#g1)" stroke="hsl(var(--primary))" strokeOpacity="0.4" />
      <text x="40" y="45" fill="hsl(var(--primary))" fontSize="12" fontWeight="700">BROWSER · CLIENT</text>

      <Box x={40} y={60} w={220} h={60} title="Lab UI (React 19)" sub="Petunjuk · Panel alat · Hasil" />
      <Box x={290} y={60} w={220} h={60} title="LabScene 3D (R3F)" sub="Bubbles · Steam · Flash · Pour" />
      <Box x={540} y={60} w={220} h={60} title="ChemAssistant" sub="Streaming chat AI" />

      {/* Engine layer */}
      <rect x="20" y="160" width="500" height="80" rx="12" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent))" strokeOpacity="0.4" />
      <text x="40" y="185" fill="hsl(var(--accent))" fontSize="12" fontWeight="700">SIMULATION ENGINE · PURE TS</text>
      <Box x={40} y={195} w={220} h={35} title="chem-engine.ts" sub="addReagent · evaluate · detectReaction" small />
      <Box x={280} y={195} w={220} h={35} title="BeakerState" sub="contents · addOrder · color · pH" small />

      {/* Server layer */}
      <rect x="540" y="160" width="240" height="80" rx="12" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" strokeOpacity="0.4" />
      <text x="560" y="185" fill="hsl(var(--primary))" fontSize="12" fontWeight="700">EDGE · SERVER FN</text>
      <Box x={560} y={195} w={200} h={35} title="/api/chat" sub="Gemini via Lovable AI" small />

      {/* Data layer */}
      <rect x="20" y="260" width="760" height="80" rx="12" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" />
      <text x="40" y="285" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="700">DATA · LOVABLE CLOUD (POSTGRES + AUTH + RLS)</text>
      <Box x={40} y={295} w={170} h={35} title="modules" sub="steps · target · theory" small />
      <Box x={225} y={295} w={170} h={35} title="attempts" sub="score · steps_log" small />
      <Box x={410} y={295} w={170} h={35} title="profiles" sub="nama · avatar" small />
      <Box x={595} y={295} w={170} h={35} title="user_roles" sub="RLS aman" small />

      {/* arrows */}
      <line x1="150" y1="120" x2="150" y2="195" stroke="hsl(var(--primary))" strokeOpacity="0.5" markerEnd="url(#arr)" />
      <line x1="400" y1="120" x2="400" y2="195" stroke="hsl(var(--primary))" strokeOpacity="0.5" markerEnd="url(#arr)" />
      <line x1="650" y1="120" x2="650" y2="195" stroke="hsl(var(--primary))" strokeOpacity="0.5" markerEnd="url(#arr)" />
      <line x1="150" y1="230" x2="150" y2="295" stroke="hsl(var(--primary))" strokeOpacity="0.5" markerEnd="url(#arr)" />
      <line x1="650" y1="230" x2="650" y2="295" stroke="hsl(var(--primary))" strokeOpacity="0.5" markerEnd="url(#arr)" />
    </svg>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  small,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  small?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <text x={x + 12} y={y + (small ? 16 : 24)} fill="hsl(var(--foreground))" fontSize={small ? "11" : "13"} fontWeight="600">
        {title}
      </text>
      <text x={x + 12} y={y + (small ? 30 : 44)} fill="hsl(var(--muted-foreground))" fontSize="10">
        {sub}
      </text>
    </g>
  );
}

function UserFlowDiagram() {
  const steps = [
    { t: "Login", d: "email / Google" },
    { t: "Dashboard", d: "pilih modul" },
    { t: "Petunjuk", d: "baca tujuan & safety" },
    { t: "Simulasi 3D", d: "ambil, tuang, aduk" },
    { t: "AI feedback", d: "koreksi real-time" },
    { t: "Hasil & evaluasi", d: "skor + refleksi" },
  ];
  return (
    <svg viewBox="0 0 900 200" className="w-full">
      <defs>
        <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--accent))" />
        </marker>
      </defs>
      {steps.map((s, i) => {
        const x = 20 + i * 145;
        return (
          <g key={s.t}>
            <rect x={x} y={60} width="130" height="80" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeOpacity="0.4" />
            <circle cx={x + 20} cy={80} r="12" fill="hsl(var(--accent) / 0.2)" />
            <text x={x + 20} y={84} textAnchor="middle" fill="hsl(var(--accent))" fontSize="12" fontWeight="700">{i + 1}</text>
            <text x={x + 40} y={85} fill="hsl(var(--foreground))" fontSize="13" fontWeight="600">{s.t}</text>
            <text x={x + 12} y={115} fill="hsl(var(--muted-foreground))" fontSize="11">{s.d}</text>
            {i < steps.length - 1 && (
              <line x1={x + 130} y1={100} x2={x + 145} y2={100} stroke="hsl(var(--accent))" strokeOpacity="0.6" markerEnd="url(#arr2)" />
            )}
          </g>
        );
      })}
      {/* feedback loop */}
      <path d="M 640 60 Q 500 20 360 60" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeDasharray="4 4" fill="none" markerEnd="url(#arr2)" />
      <text x="500" y="30" textAnchor="middle" fill="hsl(var(--primary))" fontSize="11" fontStyle="italic">
        loop: AI hint memicu percobaan ulang
      </text>
    </svg>
  );
}
