import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/lavajato";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Gerenciar serviços | Lava Jato Pro" },
      {
        name: "description",
        content: "Cadastre os serviços do lava jato com preço e tempo estimado de lavagem.",
      },
      { property: "og:title", content: "Gerenciar serviços | Lava Jato Pro" },
      {
        property: "og:description",
        content: "Crie, edite e exclua serviços definindo valor e duração.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Servicos,
});

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };

function Servicos() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("30");

  const { data: servicos = [], isLoading } = useQuery({
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

  function abrirNovo() {
    setEditando(null);
    setNome("");
    setPreco("");
    setDuracao("30");
    setOpen(true);
  }

  function abrirEdicao(s: Servico) {
    setEditando(s);
    setNome(s.nome);
    setPreco(String(s.preco));
    setDuracao(String(s.duracao_minutos));
    setOpen(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome do serviço");
      const payload = {
        nome: nome.trim(),
        preco: Number(preco.replace(",", ".")) || 0,
        duracao_minutos: Number(duracao) || 30,
      };
      const { error } = editando
        ? await supabase.from("servicos").update(payload).eq("id", editando.id)
        : await supabase.from("servicos").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success(editando ? "Serviço atualizado" : "Serviço criado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço excluído");
    },
    onError: () =>
      toast.error("Não é possível excluir: este serviço já possui agendamentos."),
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gerenciar serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina o valor e o tempo estimado de cada lavagem.
          </p>
        </div>
        <Button size="lg" className="shadow-glow" onClick={abrirNovo}>
          <Plus className="size-4" /> Novo serviço
        </Button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && servicos.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
      )}

      <div className="mt-6 grid gap-3">
        {servicos.map((s) => (
          <Card key={s.id} className="border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="text-base font-semibold">{s.nome}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBRL(Number(s.preco))} · {s.duracao_minutos} min
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => abrirEdicao(s)}>
                  <Pencil className="size-4" /> Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => excluir.mutate(s.id)}
                  disabled={excluir.isPending}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>Nome, valor cobrado e tempo estimado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="s-nome">Nome</Label>
              <Input id="s-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="s-preco">Preço (R$)</Label>
                <Input
                  id="s-preco"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s-dur">Duração (min)</Label>
                <Input
                  id="s-dur"
                  inputMode="numeric"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
