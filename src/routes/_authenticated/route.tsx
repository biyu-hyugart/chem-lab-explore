import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Guest mode: akses langsung tanpa login. Jika user sudah login, gunakan
// data user tersebut; kalau tidak, sediakan user tamu agar halaman tetap
// bisa diakses tanpa mengarahkan ke /auth.
const GUEST_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "guest@chemxr.local",
  user_metadata: { full_name: "Tamu" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
} as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    return { user: data.user ?? GUEST_USER! };
  },
  component: () => <Outlet />,
});
