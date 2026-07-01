
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- modules
CREATE TABLE public.modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  objective TEXT NOT NULL,
  theory TEXT NOT NULL,
  materials JSONB NOT NULL,
  steps JSONB NOT NULL,
  target JSONB NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_select_all_auth" ON public.modules FOR SELECT TO authenticated USING (true);

-- attempts
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  steps_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_state JSONB,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_own" ON public.attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update_own" ON public.attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "attempts_delete_own" ON public.attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX attempts_user_module_idx ON public.attempts(user_id, module_id);

-- Seed modules
INSERT INTO public.modules (id, title, description, difficulty, objective, theory, materials, steps, target, order_index) VALUES
('nacl-01', 'Pembuatan Larutan NaCl 0,1 M', 'Belajar menghitung dan membuat larutan garam dapur dengan konsentrasi 0,1 M sebanyak 100 mL.', 'Pemula',
 'Membuat 100 mL larutan NaCl 0,1 M dari padatan NaCl dan akuades.',
 'Molaritas (M) adalah jumlah mol zat terlarut per liter larutan. Rumus: M = n / V. Untuk membuat 100 mL NaCl 0,1 M dibutuhkan massa NaCl = M × V × Mr = 0,1 × 0,1 × 58,5 = 0,585 gram.',
 '["Padatan NaCl","Akuades","Neraca digital","Labu ukur 100 mL","Gelas kimia","Pipet tetes","Batang pengaduk"]'::jsonb,
 '[
   {"id":"weigh","label":"Timbang NaCl","expect":{"reagent":"nacl","amount":0.585,"tolerance":0.05}},
   {"id":"add-water","label":"Larutkan dengan sedikit akuades","expect":{"reagent":"water","amount":50,"tolerance":10}},
   {"id":"stir","label":"Aduk hingga homogen","expect":{"action":"stir"}},
   {"id":"fill","label":"Tera hingga 100 mL","expect":{"reagent":"water","total":100,"tolerance":2}}
 ]'::jsonb,
 '{"solute":"nacl","molarity":0.1,"volume_ml":100}'::jsonb,
 1),
('hcl-dil', 'Pengenceran Larutan HCl', 'Mengencerkan larutan HCl 1 M menjadi 0,1 M sebanyak 100 mL menggunakan rumus M1V1 = M2V2.', 'Menengah',
 'Membuat 100 mL larutan HCl 0,1 M dari larutan induk HCl 1 M.',
 'Rumus pengenceran: M1·V1 = M2·V2. Untuk 100 mL HCl 0,1 M dari HCl 1 M, dibutuhkan V1 = (0,1 × 100)/1 = 10 mL HCl pekat. INGAT: selalu tambahkan asam ke air, jangan sebaliknya.',
 '["Larutan induk HCl 1 M","Akuades","Labu ukur 100 mL","Pipet volumetri 10 mL","Gelas kimia","Bulb pipet"]'::jsonb,
 '[
   {"id":"add-water-first","label":"Isi labu dengan sebagian akuades terlebih dahulu","expect":{"reagent":"water","amount":50,"tolerance":10}},
   {"id":"add-hcl","label":"Tambahkan 10 mL HCl 1 M ke dalam air","expect":{"reagent":"hcl","amount":10,"tolerance":0.5,"requires":["add-water-first"]}},
   {"id":"fill","label":"Tera hingga 100 mL dengan akuades","expect":{"reagent":"water","total":100,"tolerance":2}},
   {"id":"stir","label":"Kocok agar homogen","expect":{"action":"stir"}}
 ]'::jsonb,
 '{"solute":"hcl","molarity":0.1,"volume_ml":100}'::jsonb,
 2),
('titrasi-01', 'Titrasi Asam-Basa Sederhana', 'Menentukan konsentrasi HCl dengan menitrasi menggunakan NaOH 0,1 M dan indikator fenolftalein.', 'Menengah',
 'Menentukan konsentrasi HCl dengan titrasi memakai NaOH 0,1 M.',
 'Pada titik ekivalen, mol asam = mol basa. M(HCl)·V(HCl) = M(NaOH)·V(NaOH). Indikator fenolftalein berubah warna dari tak berwarna menjadi merah muda pada pH ~8,3.',
 '["Larutan HCl (konsentrasi tidak diketahui)","Larutan NaOH 0,1 M","Indikator fenolftalein","Buret 50 mL","Erlenmeyer 250 mL","Pipet volumetri 25 mL","Statif"]'::jsonb,
 '[
   {"id":"add-hcl","label":"Ambil 25 mL HCl ke erlenmeyer","expect":{"reagent":"hcl","amount":25,"tolerance":0.5}},
   {"id":"add-indicator","label":"Tambahkan 3 tetes fenolftalein","expect":{"reagent":"pp","amount":3,"tolerance":1}},
   {"id":"titrate","label":"Titrasi dengan NaOH sampai berwarna merah muda","expect":{"reagent":"naoh","amount":25,"tolerance":1}},
   {"id":"record","label":"Catat volume akhir NaOH","expect":{"action":"record"}}
 ]'::jsonb,
 '{"solute":"hcl","molarity":0.1,"volume_ml":25}'::jsonb,
 3);
