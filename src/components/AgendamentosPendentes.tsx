import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/lavajato";

type Agendamento = {
  id: string;
  data_hora: string;
  status: string;
  clientes: { nome: string; telefone: string | null } | null;
  servicos: { nome: string; preco: number } | null;
  veiculos: { placa: string } | null;
};

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgendamentosPendentes() {
  const queryClient = useQueryClient();

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos", "pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          "id, data_hora, status, clientes(nome, telefone), servicos(nome, preco), veiculos(placa)",
        )
        .eq("status", "Pendente")
        .order("data_hora");
      if (error) throw error;
      return data as unknown as Agendamento[];
    },
  });

  const confirmar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "Confirmado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Agendamento confirmado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function confirmarViaWhatsApp(a: Agendamento) {
    const mensagem = `Olá ${a.clientes?.nome ?? ""}, seu agendamento para a lavagem ${
      a.servicos?.nome ?? ""
    } do veículo placa ${a.veiculos?.placa ?? ""} foi confirmado para ${formatarDataHora(
      a.data_hora,
    )}!`;
    const numero = (a.clientes?.telefone ?? "").replace(/\D/g, "");
    const telefoneCompleto = numero
      ? numero.length <= 11
        ? `55${numero}`
        : numero
      : "";
    const url = `https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    confirmar.mutate(a.id);
  }

  return (
    <Card className="mt-8 border-border/60">
      <CardHeader>
        <CardTitle>Agendamentos pendentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && agendamentos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum agendamento aguardando confirmação.
          </p>
        )}
        {agendamentos.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/30 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{a.clientes?.nome ?? "Cliente"}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium status-fila">
                  Pendente
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.servicos?.nome} · {formatBRL(Number(a.servicos?.preco ?? 0))} · placa{" "}
                <span className="font-mono">{a.veiculos?.placa ?? "—"}</span>
              </p>
              <p className="mt-1 text-sm">{formatarDataHora(a.data_hora)}</p>
            </div>
            <Button onClick={() => confirmarViaWhatsApp(a)} disabled={confirmar.isPending}>
              <MessageCircle className="size-4" /> Confirmar via WhatsApp
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
