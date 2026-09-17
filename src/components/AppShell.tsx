import { Link } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
              <Droplets className="size-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Lava Jato Pro</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              Painel
            </Link>
            <Link
              to="/clientes"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              Clientes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
