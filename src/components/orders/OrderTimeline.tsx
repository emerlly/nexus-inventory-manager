import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types";

const FLOW: { key: OrderStatus; label: string }[] = [
  { key: "Reservado", label: "Reservado" },
  { key: "Separando", label: "Em Separação" },
  { key: "Faturado", label: "Faturado" },
  { key: "Enviado", label: "Enviado" },
  { key: "Entregue", label: "Entregue" },
];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelado") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Pedido cancelado</span>
      </div>
    );
  }

  const currentIdx = FLOW.findIndex((s) => s.key === status);

  return (
    <div className="flex w-full items-start justify-between">
      {FLOW.map((step, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${idx === 0 ? "bg-transparent" : done || current ? "bg-primary" : "bg-border"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : current
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className={`h-0.5 flex-1 ${idx === FLOW.length - 1 ? "bg-transparent" : done ? "bg-primary" : "bg-border"}`} />
            </div>
            <span className={`mt-2 text-center text-xs ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
