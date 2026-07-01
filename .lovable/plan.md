
# ChemXR — Rencana MVP

Website laboratorium kimia virtual dalam Bahasa Indonesia, satu ruangan lab dengan simulasi 3D sederhana (Three.js), asisten AI, dan alur praktikum lengkap.

## Halaman & Alur

```text
/ (Landing)  →  /auth (Login/Daftar)  →  /dashboard (pilih modul)
                                         │
                                         ▼
                                    /lab/$moduleId
                                    ├── Panel Petunjuk
                                    ├── Meja Lab 3D (Three.js)
                                    ├── Panel Alat & Bahan
                                    └── AI Asisten (chat)
                                         │
                                         ▼
                                    /lab/$moduleId/hasil
                                    (hasil eksperimen, evaluasi, progres)
```

## Fitur Inti

1. **Landing page** — hero, penjelasan ChemXR, fitur, cara kerja, CTA "Mulai Praktikum".
2. **Autentikasi** — email/password + Google (via Lovable Cloud). Profil user (nama, avatar) tersimpan.
3. **Dashboard modul** — daftar modul praktikum (kartu dengan judul, deskripsi, tingkat kesulitan, status: belum/selesai). Modul awal:
   - Pembuatan Larutan NaCl 0.1 M
   - Pengenceran Larutan HCl
   - Titrasi Asam-Basa sederhana
4. **Halaman Petunjuk** — tujuan, alat & bahan, langkah-langkah, keselamatan. Tombol "Mulai Simulasi".
5. **Ruang Lab 3D** — satu ruangan lab dengan:
   - Meja lab dengan alat 3D (gelas kimia, labu ukur, pipet, botol reagen) memakai Three.js + React Three Fiber.
   - Klik alat/bahan → panel aksi (ambil zat X mL, tuang ke gelas, aduk, panaskan).
   - Larutan berubah warna & volume secara real-time.
   - Indikator konsentrasi/molaritas yang dihitung otomatis.
6. **AI Asisten** — panel chat di sisi kanan, streaming, memakai Lovable AI (`google/gemini-3-flash-preview`) dengan system prompt sebagai asisten kimia berbahasa Indonesia. Mendapat konteks langkah saat ini + state larutan. Memberi peringatan otomatis saat langkah salah (mis. urutan penambahan asam ke air).
7. **Halaman Hasil** — ringkasan eksperimen (larutan yang dibuat, molaritas, pH), evaluasi otomatis (benar/salah per langkah), penjelasan pembelajaran singkat, dan progres user (X dari Y modul selesai).

## Detail Teknis

- **Stack**: TanStack Start + React + Tailwind. Semua UI Bahasa Indonesia.
- **3D**: `three`, `@react-three/fiber`, `@react-three/drei`. Model alat pakai geometry primitives (silinder, kerucut) — ringan, tidak perlu asset eksternal.
- **Backend**: Lovable Cloud (Supabase managed):
  - Tabel `profiles` (nama, avatar_url) auto-created via trigger.
  - Tabel `modules` (seed 3 modul + langkah dalam JSON).
  - Tabel `attempts` (user_id, module_id, steps_taken, score, completed_at).
  - Tabel `user_roles` (pola aman, jika perlu admin nanti).
  - RLS: user hanya baca/tulis data sendiri; modul publik untuk semua authenticated.
- **AI**: server function `askAssistant` yang stream jawaban dari Lovable AI Gateway. Konteks: modul aktif, langkah saat ini, state larutan.
- **Rute**: `_authenticated/` untuk dashboard, lab, hasil. `/` dan `/auth` publik.
- **Desain**: tema laboratorium modern — biru sains + aksen hijau tabung reaksi, background gelap lembut, tipografi bersih (Inter/Space Grotesk). Bukan ungu default AI. Ilustrasi molekul halus.

## Yang TIDAK termasuk MVP ini

- Modul lebih dari 3 (bisa ditambah nanti).
- Multiplayer / kelas / laporan guru.
- Ekspor PDF hasil praktikum.
- Level admin untuk buat modul (dilanjutkan iterasi berikutnya).

## Konten Praktikum

Karena bapak belum menentukan, saya pakai 3 modul standar SMA/awal kuliah di atas. Isi bisa saya sesuaikan setelah MVP jalan.

## Estimasi urutan pembuatan

1. Design system + landing page + auth UI
2. Lovable Cloud + skema DB + auth flow (email + Google)
3. Dashboard + halaman petunjuk (data dummy dari DB)
4. Ruang lab 3D + engine simulasi larutan sederhana
5. AI asisten (server function + panel chat)
6. Halaman hasil + progres

Setuju lanjut dengan rencana ini, atau ada bagian yang mau diubah dulu?
