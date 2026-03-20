import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { orderService, productService } from "@/services";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Package, CheckCircle2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { DetailDialog } from "@/components/DetailDialog";

const STATUS_STEPS = [
  { key: "PENDENTE", label: "Pendente" },
  { key: "RESERVADO", label: "Reservado" },
  { key: "SEPARANDO", label: "Separando" },
  { key: "FATURADO", label: "Faturado" },
  { key: "CANCELADO", label: "Cancelado" },
];

const statusColors = {
  pendente: "bg-muted text-muted-foreground",
  reservado: "bg-yellow-100 text-yellow-700",
  separando: "bg-blue-100 text-blue-700",
  faturado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

// Roles that can change order status
const STATUS_CHANGE_ROLES = ["admin", "gerente", "estoquista", "operador"];

function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  // Exclude "cancelado" from stepper flow
  const flowSteps = STATUS_STEPS.filter((s) => s.key !== "Cancelado");
  const currentIdx = flowSteps.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "Cancelado";

  if (isCancelled) {
    return (
      <Badge className={statusColors.cancelado}>Cancelado</Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {flowSteps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${isDone ? "bg-success text-success-foreground" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={`hidden text-xs xl:inline ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
            {idx < flowSteps.length - 1 && <div className={`mx-1 h-0.5 w-4 rounded ${isDone ? "bg-success" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}


export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: orderService.getAll });

  const canChangeStatus = STATUS_CHANGE_ROLES.includes(user?.role || "");

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => orderService.updateStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast({ title: "Status atualizado!" }); },
    onError: (error: any) => toast({ variant: "destructive", title: `Erro ao atualizar status`, description: error.response?.data?.message || "Tente novamente mais tarde." }),
  });

  const filtered = data.filter((o: Order) => {
    const customerName = typeof o.customer === "object" ? o.customer?.name : "";
    const matchSearch = !search || customerName?.toLowerCase().includes(search.toLowerCase()) || o._id.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const getDetailFields = (o: Order) => [
    { label: "ID", value: `#${o._id.slice(-15)}` },
    { label: "Cliente", value: typeof o.customer === "object" ? o.customer?.name : "—" },
    { label: "Status", value: o.status },
    { label: "Total", value: `R$ ${o.totalOrder?.toFixed(2)}` },
    { label: "Data", value: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "—" },
    { label: "Atualizado", value: o.updatedAt ? new Date(o.updatedAt).toLocaleDateString("pt-BR") : "—" },
  ];

  const getDetailItems = (o: Order) => ({
    columns: [
      { key: "product", label: "Produto" },
      { key: "quantity", label: "Qtd" },
      { key: "unitPrice", label: "Preço Unit." },
      { key: "total", label: "Subtotal" },
    ],
    data: (o.items || []).map((item) => ({
      product: typeof item.product === "object" ? item.product?.name : item.product,
      quantity: item.quantity,
      unitPrice: `R$ ${item.unitPrice?.toFixed(2)}`,
      total: `R$ ${item.total?.toFixed(2)}`,
    })),
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Acompanhamento de Pedidos" />
      <div className="flex-1 space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por cliente ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_STEPS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}</div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: Order) => {
              const customerName = typeof order.customer === "object" ? order.customer?.name : "—";
              const isExpanded = expandedId === order._id;
              return (
                <Card key={order._id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">#{order._id.slice(-15)}</span>
                          <Badge className={statusColors[order.status]}>{STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailOrder(order)} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-medium">{customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "itens"} · R$ {order.totalOrder?.toFixed(2)}
                        </p>
                        {order.createdAt && <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>}
                      </div>
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <StatusStepper currentStatus={order.status} />
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleExpand(order._id)}>
                            {isExpanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                            Itens
                          </Button>
                          {canChangeStatus && order.status !== "Entregue" && order.status !== "Cancelado" && (
                            <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order._id, status: v as OrderStatus })}>
                              <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {STATUS_STEPS.map((s) => (
                                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded items view */}
                    {isExpanded && (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-foreground">Itens do Pedido</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Qtd</TableHead>
                              <TableHead className="text-right">Preço Unit.</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(order.items || []).map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{typeof item.product === "object" ? item.product?.name : item.product}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">R$ {item.unitPrice?.toFixed(2)}</TableCell>
                                <TableCell className="text-right">R$ {item.total?.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-semibold">
                              <TableCell colSpan={3} className="text-right">Total</TableCell>
                              <TableCell className="text-right">R$ {order.totalOrder?.toFixed(2)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {detailOrder && (
        <DetailDialog
          open={!!detailOrder}
          onOpenChange={() => setDetailOrder(null)}
          title="Detalhes do Pedido"
          fields={getDetailFields(detailOrder)}
          items={getDetailItems(detailOrder)}
        />
      )}
    </div>
  );
}
