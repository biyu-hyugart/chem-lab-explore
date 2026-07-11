import { Link } from "@tanstack/react-router";
import { Atom } from "lucide-react";

export function AppHeader({ userName }: { userName?: string | null }) {
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
          {userName && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
          )}
          <Link to="/tentang" className="text-sm text-muted-foreground hover:text-foreground">
            Tentang
          </Link>
        </div>
      </div>
    </header>
  );
}
