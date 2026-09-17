import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NovaOrdemDialog } from "@/components/NovaOrdemDialog";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes e veículos | Lava Jato Pro" },
      {
        name: "description",
        content: "Lista completa de clientes do lava jato com telefone e veículos cadastrados.",
      },
      { property: "og:title", content: "Clientes e veículos | Lava Jato Pro" },
      {
        property: "og:description",
        content: "Consulte clientes, telefones e os veículos de cada um.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Clientes,
});

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  veiculos: { id: string; placa: string; marca: string | null; modelo: string | null; cor: string | null }[];
};

function Clientes() {
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", "com-veiculos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone, veiculos(id, placa, marca, modelo, cor)")
        .order("nome");
      if (error) throw error;
      return data as unknown as Cliente[];
    },
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os clientes e os veículos cadastrados.
          </p>
        </div>
        <NovaOrdemDialog />
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && clientes.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda. Eles são criados junto com a primeira ordem de serviço.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {clientes.map((c) => (
          <Card key={c.id} className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-lg">
                {c.nome}
                {c.telefone && (
                  <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                    <Phone className="size-3.5" /> {c.telefone}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.veiculos.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem veículos cadastrados.</p>
              )}
              {c.veiculos.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm"
                >
                  <span className="font-mono font-semibold">{v.placa}</span>
                  <span className="text-muted-foreground">
                    {[v.marca, v.modelo, v.cor].filter(Boolean).join(" · ") || "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
