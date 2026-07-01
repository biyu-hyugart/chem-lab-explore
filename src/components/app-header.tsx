import { Link, useNavigate } from "@tanstack/react-router";
import { Atom, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function AppHeader({ userName }: { userName?: string | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Atom className="size-4" />
          </div>
          <span className="font-display font-semibold">ChemXR</span>
        </Link>
        <div className="flex items-center gap-3">
          {userName && <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 size-4" />
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
