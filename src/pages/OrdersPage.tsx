import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { orderService } from "@/services";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, CheckCircle2 } from "lucide-react";

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pendente", label: "Pendente" },
  { key: "separando", label: "Separando" },
  { key: "produzindo", label: "Produzindo" },
  { key: "enviado", label: "Enviado" },
  { key: "entregue", label: "Entregue" },
];

const statusColors: Record<OrderStatus, string> = {
  pendente: "bg-muted text-muted-foreground",
  separando: "bg-warning/15 text-warning border-warning/30",
  produzindo: "bg-primary/15 text-primary border-primary/30",
  enviado: "bg-blue-100 text-blue-700 border-blue-300",
  entregue: "bg-success/15 text-success border-success/30",
};

function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${isDone
                  ? "bg-success text-success-foreground"
                  : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={`hidden text-xs sm:inline ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 w-4 rounded ${isDone ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: orderService.getAll });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao atualizar status" }),
  });

  const filtered = data.filter((o: Order) => {
    const customerName = typeof o.customer === "object" ? o.customer?.name : "";
    const matchSearch = !search || customerName?.toLowerCase().includes(search.toLowerCase()) || o._id.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Acompanhamento de Pedidos" />
      <div className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_STEPS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: Order) => {
              const customerName = typeof order.customer === "object" ? order.customer?.name : "—";
              return (
                <Card key={order._id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Order info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">#{order._id.slice(-15)}</span>
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </div>
                        <p className="font-medium">{customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "itens"} · R$ {order.totalOrder?.toFixed(2)}
                        </p>
                        {order.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>

                      {/* Status stepper */}
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <StatusStepper currentStatus={order.status} />
                        {order.status !== "entregue" && (
                          <Select
                            value={order.status}
                            onValueChange={(v) => updateStatus.mutate({ id: order._id, status: v as OrderStatus })}
                          >
                            <SelectTrigger className="h-8 w-40 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_STEPS.map((s) => (
                                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
