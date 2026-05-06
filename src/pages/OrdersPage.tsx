import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { orderService } from "@/services";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/contexts/PermissionContext";
import { Search, Package, Eye, LayoutGrid, List as ListIcon, CalendarIcon, X } from "lucide-react";
import { PERMISSIONS } from "@/constants/permissions";
import { OrderKanban, KANBAN_COLUMNS } from "@/components/orders/OrderKanban";
import { OrderTimeline } from "@/components/orders/OrderTimeline";

const statusColors: Record<string, string> = {
  Reservado: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Separando: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Faturado: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Enviado: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Entregue: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function isOverdue(o: Order) {
  if (!o.createdAt || ["Entregue", "Cancelado"].includes(o.status)) return false;
  return (Date.now() - new Date(o.createdAt).getTime()) / 86400000 > 7;
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canChangeStatus = hasPermission(PERMISSIONS.ORDERS_UPDATE_STATUS);

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeller, setFilterSeller] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const { data = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: orderService.getAll,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["orders"] });
      const prev = qc.getQueryData<Order[]>(["orders"]);
      qc.setQueryData<Order[]>(["orders"], (old) =>
        (old || []).map((o) => (o._id === id ? { ...o, status } : o))
      );
      return { prev };
    },
    onError: (error: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["orders"], ctx.prev);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error?.response?.data?.error || "Tente novamente.",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const sellers = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((o) => {
      const s: any = o.seller;
      if (s && typeof s === "object" && s._id) map.set(s._id, s.name || "—");
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((o) => {
      const customerName = typeof o.customer === "object" ? o.customer?.name || "" : "";
      if (search) {
        const s = search.toLowerCase();
        if (!customerName.toLowerCase().includes(s) && !o._id.toLowerCase().includes(s)) return false;
      }
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterSeller !== "all") {
        const sid = typeof o.seller === "object" ? (o.seller as any)?._id : o.seller;
        if (sid !== filterSeller) return false;
      }
      if (filterUrgency === "overdue" && !isOverdue(o)) return false;
      if (filterUrgency === "ontime" && isOverdue(o)) return false;
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (startDate && d < startDate) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      return true;
    });
  }, [data, search, filterStatus, filterSeller, filterUrgency, startDate, endDate]);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    if (!canChangeStatus) {
      toast({ variant: "destructive", title: "Sem permissão para alterar status" });
      return;
    }
    updateStatus.mutate({ id, status });
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterSeller("all");
    setFilterUrgency("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasFilters =
    search || filterStatus !== "all" || filterSeller !== "all" || filterUrgency !== "all" || startDate || endDate;

  return (
    <div className="flex flex-col">
      <AppHeader title="Acompanhamento de Pedidos" />
      <div className="flex-1 space-y-4 p-6">
        {/* Toolbar */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-1 rounded-md border p-1">
                <Button
                  size="sm"
                  variant={view === "kanban" ? "default" : "ghost"}
                  onClick={() => setView("kanban")}
                  className="h-8"
                >
                  <LayoutGrid className="mr-1.5 h-4 w-4" /> Kanban
                </Button>
                <Button
                  size="sm"
                  variant={view === "list" ? "default" : "ghost"}
                  onClick={() => setView("list")}
                  className="h-8"
                >
                  <ListIcon className="mr-1.5 h-4 w-4" /> Lista
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {KANBAN_COLUMNS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSeller} onValueChange={setFilterSeller}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Vendedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos vendedores</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Urgência" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas urgências</SelectItem>
                  <SelectItem value="overdue">Atrasados (&gt;7 dias)</SelectItem>
                  <SelectItem value="ontime">No prazo</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="mr-1.5 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="mr-1.5 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} />
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  <X className="mr-1 h-4 w-4" /> Limpar
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                {filtered.length} pedido(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          </div>
        ) : view === "kanban" ? (
          <OrderKanban
            orders={filtered}
            onStatusChange={handleStatusChange}
            onOpen={setDetailOrder}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Itens</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const cn = typeof o.customer === "object" ? o.customer?.name : "—";
                    return (
                      <TableRow key={o._id} className={isOverdue(o) ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-xs">#{o._id.slice(-8)}</TableCell>
                        <TableCell className="font-medium">{cn}</TableCell>
                        <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[o.status] || "bg-muted"}>{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{o.items?.length ?? 0}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {o.totalValue?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setDetailOrder(o)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail dialog with timeline */}
      <Dialog open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <OrderTimeline status={detailOrder.status} />
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">#{detailOrder._id.slice(-15)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">
                    {typeof detailOrder.customer === "object" ? detailOrder.customer?.name : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium">
                    {detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <p className="text-sm font-medium">{detailOrder.paymentMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status Pagamento</p>
                  <p className="text-sm font-medium">{detailOrder.paymentStatus || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold text-primary">R$ {detailOrder.totalValue?.toFixed(2)}</p>
                </div>
              </div>

              {canChangeStatus && detailOrder.status !== "Entregue" && detailOrder.status !== "Cancelado" && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="text-sm font-medium">Alterar status:</span>
                  <Select
                    value={detailOrder.status}
                    onValueChange={(v) => {
                      handleStatusChange(detailOrder._id, v as OrderStatus);
                      setDetailOrder({ ...detailOrder, status: v as OrderStatus });
                    }}
                  >
                    <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KANBAN_COLUMNS.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">Itens do Pedido</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detailOrder.items || []).map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{typeof item.product === "object" ? item.product?.name : item.product}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {item.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
