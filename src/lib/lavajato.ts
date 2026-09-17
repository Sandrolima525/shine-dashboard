export type StatusLavagem = "Na Fila" | "Lavando" | "Pronto" | "Entregue";

export const STATUS_LIST: StatusLavagem[] = ["Na Fila", "Lavando", "Pronto", "Entregue"];

export const statusClass: Record<StatusLavagem, string> = {
  "Na Fila": "status-fila",
  Lavando: "status-lavando",
  Pronto: "status-pronto",
  Entregue: "status-entregue",
};

export const TIPOS_LAVAGEM = [
  "Simples",
  "Completa",
  "Enceramento",
  "Higienização interna",
  "Polimento",
];

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
