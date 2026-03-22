import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { orderService, saleService } from "@/services";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

const paymentStatusColors: Record<string, string> = {
  PENDENTE: "bg-warning/15 text-warning border-warning/30",
  PAGO: "bg-success/15 text-success border-success/30",
  ATRASADO: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELADO: "bg-muted text-muted-foreground",
};

const paymentStatusIcons: Record<string, React.ReactNode> = {
  PENDENTE: <Clock className="h-3.5 w-3.5" />,
  PAGO: <CheckCircle className="h-3.5 w-3.5" />,
  ATRASADO: <AlertTriangle className="h-3.5 w-3.5" />,
  CANCELADO: <XCircle className="h-3.5 w-3.5" />,
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.getAll,
  });

  const confirmPayment = useMutation({
    mutationFn: (id: string) => saleService.confirmPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["payment"] });
      toast({ title: "Pagamento confirmado!" });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Erro inesperado";

      toast({
        variant: "destructive",
        title: "Erro ao confirmar pagamento",
    
      });
    }
  });

  const filtered = orders.filter((o: any) => {
    const name = o.customer?.name || "";
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      o._id.includes(search);

    if (tab === "all") return matchesSearch;
    if (tab === "Pendente") return matchesSearch && o.paymentStatus !== "Pago" && o.status !== "Cancelado";
    if (tab === "Pago") return matchesSearch && o.paymentStatus === "Pago";
    if (tab === "Cancelado") return matchesSearch && o.status === "Cancelado";
    return matchesSearch;
  });

  const pendingCount = orders.filter((o: any) => o.paymentStatus !== "Pago" && o.status !== "Cancelado").length;
  const paidCount = orders.filter((o: any) => o.paymentStatus === "Pago").length;
  const totalPending = orders
    .filter((o: any) => o.paymentStatus !== "Pago" && o.status !== "Cancelado")
    .reduce((sum: number, o: any) => sum + (o.totalValue || o.totalOrder || 0), 0);

  return (
    <div className="flex flex-col">
      <AppHeader title="Pagamentos Pendentes" />

      <div className="p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-xl font-bold">{paidCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-xl font-bold">R$ {totalPending.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou nº do pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="pago">Pagos</TabsTrigger>
              <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum pagamento encontrado.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status Pedido</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order: any) => {
                  const payStatus = order.paymentStatus || "Pendente";
                  const expanded = expandedId === order._id;

                  return (
                    <>
                      <TableRow key={order._id} className="group">
                        <TableCell className="font-mono text-xs">
                          #{order._id.slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.customer?.name || "—"}
                        </TableCell>
                        <TableCell>
                          R$ {(order.totalValue || order.totalOrder || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${paymentStatusColors[payStatus] || paymentStatusColors.PENDENTE}`}>
                            {paymentStatusIcons[payStatus] || paymentStatusIcons.PENDENTE}
                            {payStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {payStatus !== "pago" && order.status !== "Cancelado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmPayment.mutate(order._id)}
                                disabled={confirmPayment.isPending}
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Confirmar
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setExpandedId(expanded ? null : order._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow key={`${order._id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Produto</TableHead>
                                  <TableHead>Qtd</TableHead>
                                  <TableHead>Preço Unit.</TableHead>
                                  <TableHead>Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(order.items || []).map((item: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell>{item.product?.name || "—"}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>R$ {item.unitPrice?.toFixed(2)}</TableCell>
                                    <TableCell>R$ {(item.totalPrice || item.quantity * item.unitPrice)?.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
