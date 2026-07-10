import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Beaker, Cpu, Shield, Sparkles, GraduationCap, Atom } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary glow-primary">
            <Atom className="size-5" />
          </div>
          <span className="font-display text-xl font-semibold">ChemXR</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <a href="#fitur" className="hover:text-foreground">Fitur</a>
          <a href="#cara-kerja" className="hover:text-foreground">Cara Kerja</a>
          <a href="#modul" className="hover:text-foreground">Modul</a>
          <Link to="/tentang" className="hover:text-foreground">Tentang</Link>
        </nav>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Masuk</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Mulai Gratis</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        <section className="relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Laboratorium kimia virtual dengan asisten AI
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
              Praktikum kimia,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                di mana saja
              </span>
              , tanpa risiko.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              ChemXR adalah laboratorium kimia virtual berbasis browser. Buat larutan,
              lakukan titrasi, dan pelajari reaksi kimia dalam simulasi 3D dengan
              panduan asisten AI berbahasa Indonesia.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="glow-primary">
                <Link to="/auth">Mulai Praktikum</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#cara-kerja">Lihat Cara Kerja</a>
              </Button>
            </div>
          </div>

          {/* Preview illustration */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-3 gap-4">
            {[
              { c: "#7dd3fc", n: "Akuades" },
              { c: "#fef3c7", n: "HCl 1 M" },
              { c: "#f472b6", n: "PP + Basa" },
            ].map((b) => (
              <div
                key={b.n}
                className="glass-panel flex flex-col items-center justify-end p-6 aspect-[3/4]"
              >
                <div
                  className="w-full flex-1 rounded-b-2xl rounded-t-md border border-white/10"
                  style={{
                    background: `linear-gradient(180deg, transparent 30%, ${b.c}dd 30%)`,
                  }}
                />
                <p className="mt-3 text-sm text-muted-foreground">{b.n}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="fitur" className="py-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Fitur utama</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Semua yang kamu butuhkan untuk memahami larutan dan reaksi dasar.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Beaker,
                title: "Simulasi 3D interaktif",
                desc: "Alat lab dan larutan divisualisasikan dalam 3D yang bisa kamu putar dan zoom.",
              },
              {
                icon: Cpu,
                title: "Asisten AI kimia",
                desc: "Panduan langkah demi langkah dan koreksi otomatis jika kamu keliru.",
              },
              {
                icon: Shield,
                title: "Aman & tanpa risiko",
                desc: "Tanpa bahan berbahaya. Pelajari keselamatan lab tanpa risiko nyata.",
              },
              {
                icon: GraduationCap,
                title: "Evaluasi hasil belajar",
                desc: "Skor otomatis, evaluasi per langkah, dan progres modul praktikum.",
              },
            ].map((f) => (
              <div key={f.title} className="glass-panel p-6">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cara-kerja" className="py-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Cara kerja</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Masuk", d: "Daftar cepat via email atau Google." },
              { n: "2", t: "Pilih modul", d: "Pilih praktikum sesuai materi yang ingin dipelajari." },
              { n: "3", t: "Simulasi 3D", d: "Ikuti langkah, ambil zat, tuang, aduk, amati reaksi." },
              { n: "4", t: "Evaluasi", d: "Lihat hasil, skor, dan penjelasan pembelajaran." },
            ].map((s) => (
              <div key={s.n} className="glass-panel p-6">
                <div className="font-display text-4xl font-bold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="modul" className="py-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Modul awal</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Pembuatan Larutan NaCl 0,1 M", d: "Pemula", p: "Hitung massa, timbang, larutkan, dan tera hingga 100 mL." },
              { t: "Pengenceran HCl", d: "Menengah", p: "Gunakan rumus M₁V₁ = M₂V₂ dan aturan keselamatan." },
              { t: "Titrasi Asam-Basa", d: "Menengah", p: "Tentukan konsentrasi HCl dengan NaOH & indikator PP." },
            ].map((m) => (
              <div key={m.t} className="glass-panel p-6">
                <span className="text-xs text-accent">{m.d}</span>
                <h3 className="mt-2 text-lg font-semibold">{m.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.p}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Coba Sekarang</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 max-w-7xl px-6 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ChemXR — Laboratorium Kimia Virtual.
      </footer>
    </div>
  );
}
