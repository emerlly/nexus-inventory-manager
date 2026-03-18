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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Eye } from "lucide-react";

// =========================
// STATUS PADRÃO BACKEND
// =========================
const STATUS = {
  PENDENTE: "PENDENTE",
  RESERVADO: "RESERVADO",
  SEPARANDO: "SEPARANDO",
  FATURADO: "FATURADO",
  CANCELADO: "CANCELADO",
} as const;

// =========================
// CORES
// =========================
const statusColors: any = {
  PENDENTE: "bg-gray-200",
  RESERVADO: "bg-yellow-200",
  SEPARANDO: "bg-blue-200",
  FATURADO: "bg-green-200",
  CANCELADO: "bg-red-200",
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // =========================
  // BUSCAR PEDIDOS
  // =========================
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.getAll,
  });

  // =========================
  // ALTERAR STATUS
  // =========================
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) =>
      orderService.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Status atualizado!" });
    },
  });

  // =========================
  // CONFIRMAR PAGAMENTO
  // =========================
  const confirmPayment = useMutation({
    mutationFn: (id: string) => saleService.confirmPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast({ title: "Pagamento confirmado!" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar pagamento",
      });
    },
  });

  const filtered = orders.filter((o: any) => {
    const name = o.customer?.name || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      o._id.includes(search)
    );
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Pedidos" />

      <div className="p-6 space-y-4">

        {/* BUSCA */}
        <Input
          placeholder="Buscar pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* LISTA */}
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          filtered.map((order: any) => {
            const expanded = expandedId === order._id;

            return (
              <Card key={order._id}>
                <CardContent className="p-4 space-y-3">

                  {/* HEADER */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        #{order._id.slice(-6)}
                      </p>
                      <p className="font-semibold">
                        {order.customer?.name}
                      </p>
                      <p className="text-sm">
                        R$ {order.totalValue?.toFixed(2)}
                      </p>
                    </div>

                    <Badge className={statusColors[order.status]}>
                      {order.status}
                    </Badge>
                  </div>

                  {/* AÇÕES */}
                  <div className="flex gap-2 flex-wrap">

                    {/* PAGAMENTO */}
                    {order.paymentStatus !== "PAGO" &&
                      order.status !== "CANCELADO" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            confirmPayment.mutate(order._id)
                          }
                        >
                          Confirmar Pagamento
                        </Button>
                      )}

                    {/* STATUS */}
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        updateStatus.mutate({
                          id: order._id,
                          status: v,
                        })
                      }
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {order.status === "PENDENTE" && (
                          <>
                            <SelectItem value="RESERVADO">
                              Reservar
                            </SelectItem>
                            <SelectItem value="SEPARANDO">
                              Separar
                            </SelectItem>
                          </>
                        )}

                        {order.status === "RESERVADO" && (
                          <SelectItem value="SEPARANDO">
                            Separar
                          </SelectItem>
                        )}

                        {order.status === "SEPARANDO" && (
                          <SelectItem value="FATURADO">
                            Faturar
                          </SelectItem>
                        )}

                        <SelectItem value="CANCELADO">
                          Cancelar
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* EXPANDIR */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : order._id
                        )
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* ITENS */}
                  {expanded && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {order.items.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>
                              {item.product?.name}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              R$ {item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              R$ {item.totalPrice.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}