import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Droplets } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/lavajato";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agende sua lavagem | Lava Jato Pro" },
      {
        name: "description",
        content:
          "Escolha o serviço, o dia e o horário e agende a lavagem do seu carro em menos de um minuto.",
      },
      { property: "og:title", content: "Agende sua lavagem | Lava Jato Pro" },
      {
        property: "og:description",
        content: "Agendamento online rápido: escolha o serviço, o horário e pronto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Agendar,
});

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };

function Agendar() {
  const [servicoId, setServicoId] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [enviado, setEnviado] = useState(false);

  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, preco, duracao_minutos")
        .order("nome");
      if (error) throw error;
      return data as Servico[];
    },
  });

  const agendar = useMutation({
    mutationFn: async () => {
      if (!servicoId) throw new Error("Escolha um serviço");
      if (!dataHora) throw new Error("Escolha o dia e o horário");
      if (!nome.trim()) throw new Error("Informe seu nome");
      if (!placa.trim()) throw new Error("Informe a placa do veículo");

      const placaNorm = placa.trim().toUpperCase();

      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("nome", nome.trim())
        .maybeSingle();

      let clienteId = existente?.id;
      if (!clienteId) {
        const { data, error } = await supabase
          .from("clientes")
          .insert({ nome: nome.trim(), telefone: telefone.trim() || null })
          .select("id")
          .single();
        if (error) throw error;
        clienteId = data.id;
      } else if (telefone.trim()) {
        await supabase.from("clientes").update({ telefone: telefone.trim() }).eq("id", clienteId);
      }

      const { data: veiculoExistente } = await supabase
        .from("veiculos")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("placa", placaNorm)
        .maybeSingle();

      let veiculoId = veiculoExistente?.id;
      if (!veiculoId) {
        const { data, error } = await supabase
          .from("veiculos")
          .insert({ cliente_id: clienteId, placa: placaNorm })
          .select("id")
          .single();
        if (error) throw error;
        veiculoId = data.id;
      }

      const { error } = await supabase.from("agendamentos").insert({
        cliente_id: clienteId,
        servico_id: servicoId,
        veiculo_id: veiculoId,
        data_hora: new Date(dataHora).toISOString(),
        status: "Pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEnviado(true);
      toast.success("Agendamento enviado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-hero px-5 py-14 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-background/20">
          <Droplets className="size-6 text-primary-foreground" />
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-primary-foreground">
          Agende sua lavagem
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80">
          Escolha o serviço e o melhor horário. Confirmamos pelo WhatsApp.
        </p>
      </div>

      <div className="mx-auto max-w-lg px-5 py-10">
        {enviado ? (
          <Card className="border-border/60 text-center">
            <CardContent className="py-10">
              <CalendarCheck className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Pedido recebido!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu agendamento está pendente de confirmação. Em breve entraremos em contato pelo
                WhatsApp.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setEnviado(false);
                  setServicoId("");
                  setDataHora("");
                  setNome("");
                  setTelefone("");
                  setPlaca("");
                }}
              >
                Fazer outro agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Serviço</Label>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome} — {formatBRL(Number(s.preco))} · {s.duracao_minutos} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dh">Dia e horário</Label>
                <Input
                  id="dh"
                  type="datetime-local"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="a-nome">Nome</Label>
                <Input id="a-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="a-tel">Telefone (WhatsApp)</Label>
                  <Input
                    id="a-tel"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="a-placa">Placa</Label>
                  <Input
                    id="a-placa"
                    placeholder="ABC1D23"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="mt-2 shadow-glow"
                onClick={() => agendar.mutate()}
                disabled={agendar.isPending}
              >
                {agendar.isPending ? "Enviando..." : "Agendar lavagem"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
