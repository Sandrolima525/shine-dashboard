import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, CircleCheck, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { NovaOrdemDialog } from "@/components/NovaOrdemDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LIST, formatBRL, statusClass, todayRange } from "@/lib/lavajato";
import type { StatusLavagem } from "@/lib/lavajato";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel do dia | Lava Jato Pro" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real os carros na fila, em lavagem, prontos e entregues no seu lava jato.",
      },
      { property: "og:title", content: "Painel do dia | Lava Jato Pro" },
      {
        property: "og:description",
        content: "Gestão simples de ordens de serviço, clientes e veículos do seu lava jato.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Ordem = {
  id: string;
  tipo_de_lavagem: string;
  valor: number;
  status: StatusLavagem;
  data: string;
  veiculos: {
    placa: string;
    marca: string | null;
    modelo: string | null;
    cor: string | null;
    clientes: { nome: string; telefone: string | null } | null;
  } | null;
};

function Dashboard() {
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens", "hoje"],
    queryFn: async () => {
      const { start, end } = todayRange();
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "id, tipo_de_lavagem, valor, status, data, veiculos(placa, marca, modelo, cor, clientes(nome, telefone))",
        )
        .gte("data", start)
        .lt("data", end)
        .order("data", { ascending: true });
      if (error) throw error;
      return data as unknown as Ordem[];
    },
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusLavagem }) => {
      const { error } = await supabase.from("ordens_servico").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const naFila = ordens.filter((o) => o.status === "Na Fila").length;
  const lavando = ordens.filter((o) => o.status === "Lavando").length;
  const prontos = ordens.filter((o) => o.status === "Pronto").length;
  const faturamento = ordens
    .filter((o) => o.status !== "Na Fila")
    .reduce((acc, o) => acc + Number(o.valor), 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Painel do dia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Carros em atendimento hoje, atualizados em um toque.
          </p>
        </div>
        <NovaOrdemDialog />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Clock className="size-4" />} label="Na fila" value={String(naFila)} />
        <Metric icon={<Car className="size-4" />} label="Lavando" value={String(lavando)} />
        <Metric
          icon={<CircleCheck className="size-4" />}
          label="Prontos"
          value={String(prontos)}
        />
        <Metric
          icon={<DollarSign className="size-4" />}
          label="Faturamento do dia"
          value={formatBRL(faturamento)}
        />
      </div>

      <Card className="mt-8 border-border/60">
        <CardHeader>
          <CardTitle>Carros de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && ordens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma lavagem registrada hoje. Crie a primeira ordem de serviço.
            </p>
          )}
          {ordens.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/30 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-semibold">
                    {o.veiculos?.placa ?? "—"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[o.status]}`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[o.veiculos?.marca, o.veiculos?.modelo, o.veiculos?.cor]
                    .filter(Boolean)
                    .join(" · ") || "Veículo"}{" "}
                  — {o.veiculos?.clientes?.nome ?? "Cliente"}
                </p>
                <p className="mt-1 text-sm">
                  {o.tipo_de_lavagem} · {formatBRL(Number(o.valor))}
                </p>
              </div>
              <Select
                value={o.status}
                onValueChange={(status) =>
                  atualizarStatus.mutate({ id: o.id, status: status as StatusLavagem })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
