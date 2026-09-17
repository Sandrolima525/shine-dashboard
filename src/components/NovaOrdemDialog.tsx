import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPOS_LAVAGEM } from "@/lib/lavajato";

const NOVO = "__novo__";

export function NovaOrdemDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState(NOVO);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [veiculoId, setVeiculoId] = useState(NOVO);
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_LAVAGEM[0]!);
  const [valor, setValor] = useState("");

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: veiculos = [] } = useQuery({
    queryKey: ["veiculos", clienteId],
    enabled: clienteId !== NOVO,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veiculos")
        .select("id, placa, marca, modelo")
        .eq("cliente_id", clienteId);
      if (error) throw error;
      return data;
    },
  });

  function reset() {
    setClienteId(NOVO);
    setNome("");
    setTelefone("");
    setVeiculoId(NOVO);
    setPlaca("");
    setMarca("");
    setModelo("");
    setCor("");
    setTipo(TIPOS_LAVAGEM[0]!);
    setValor("");
  }

  const criar = useMutation({
    mutationFn: async () => {
      let cliente = clienteId;
      if (cliente === NOVO) {
        if (!nome.trim()) throw new Error("Informe o nome do cliente");
        const { data, error } = await supabase
          .from("clientes")
          .insert({ nome: nome.trim(), telefone: telefone.trim() || null })
          .select("id")
          .single();
        if (error) throw error;
        cliente = data.id;
      }

      let veiculo = veiculoId;
      if (veiculo === NOVO) {
        if (!placa.trim()) throw new Error("Informe a placa do veículo");
        const { data, error } = await supabase
          .from("veiculos")
          .insert({
            cliente_id: cliente,
            placa: placa.trim().toUpperCase(),
            marca: marca.trim() || null,
            modelo: modelo.trim() || null,
            cor: cor.trim() || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        veiculo = data.id;
      }

      const { error } = await supabase.from("ordens_servico").insert({
        veiculo_id: veiculo,
        tipo_de_lavagem: tipo,
        valor: Number(valor.replace(",", ".")) || 0,
        status: "Na Fila",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Ordem de serviço criada!");
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-glow">
          <Plus className="size-4" /> Nova ordem de serviço
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova ordem de serviço</DialogTitle>
          <DialogDescription>Cadastre a lavagem e coloque o carro na fila.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Select
              value={clienteId}
              onValueChange={(v) => {
                setClienteId(v);
                setVeiculoId(NOVO);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOVO}>+ Novo cliente</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clienteId === NOVO && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tel">Telefone</Label>
                <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>
          )}

          {clienteId !== NOVO && (
            <div className="grid gap-2">
              <Label>Veículo</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOVO}>+ Novo veículo</SelectItem>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.placa} — {[v.marca, v.modelo].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {veiculoId === NOVO && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="placa">Placa</Label>
                <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cor">Cor</Label>
                <Input id="cor" value={cor} onChange={(e) => setCor(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo de lavagem</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LAVAGEM.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => criar.mutate()}
            disabled={criar.isPending}
            className="w-full sm:w-auto"
          >
            {criar.isPending ? "Salvando..." : "Criar ordem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
