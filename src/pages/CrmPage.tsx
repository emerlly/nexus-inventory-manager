import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { customerService, saleService, paymentService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, DollarSign, ShoppingCart, TrendingUp, Search, Eye, Phone, Mail,
} from "lucide-react";
import type { Customer, Sale, Payment } from "@/types";
import { useState } from "react";

export default function CrmPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const sales = useQuery({ queryKey: ["sales"], queryFn: saleService.getAll });
  const payments = useQuery({ queryKey: ["payments"], queryFn: paymentService.getAll });

  const customersData = (customers.data || []) as Customer[];
  const salesData = (sales.data || []) as Sale[];
  const paymentsData = (payments.data || []) as Payment[];

  // Aggregate per customer
  const customerStats = useMemo(() => {
    const map: Record<string, { totalSales: number; salesCount: number; lastSale: string; pendingAmount: number; pendingCount: number }> = {};
    salesData.forEach(s => {
      const cid = typeof s.customer === "object" ? s.customer?._id : s.customer;
      if (!cid) return;
      if (!map[cid]) map[cid] = { totalSales: 0, salesCount: 0, lastSale: "", pendingAmount: 0, pendingCount: 0 };
      map[cid].totalSales += s.totalValue || 0;
      map[cid].salesCount += 1;
      const dt = s.createdAt || "";
      if (dt > map[cid].lastSale) map[cid].lastSale = dt;
    });
    paymentsData.forEach(p => {
      if (p.type !== "receita") return;
      const cid = typeof p.customer === "object" ? (p.customer as any)?._id : p.customer;
      if (!cid) return;
      if (!map[cid]) map[cid] = { totalSales: 0, salesCount: 0, lastSale: "", pendingAmount: 0, pendingCount: 0 };
      if (p.status === "pendente" || p.status === "atrasado") {
        map[cid].pendingAmount += p.amount || 0;
        map[cid].pendingCount += 1;
      }
    });
    return map;
  }, [salesData, paymentsData]);

  const enriched = useMemo(() =>
    customersData.map(c => ({
      ...c,
      stats: customerStats[c._id] || { totalSales: 0, salesCount: 0, lastSale: "", pendingAmount: 0, pendingCount: 0 },
    })).sort((a, b) => b.stats.totalSales - a.stats.totalSales),
    [customersData, customerStats]
  );

  const filtered = search
    ? enriched.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
    : enriched;

  const totalCustomers = customersData.length;
  const totalRevenue = useMemo(() => Object.values(customerStats).reduce((s, c) => s + c.totalSales, 0), [customerStats]);
  const avgTicket = totalCustomers ? totalRevenue / totalCustomers : 0;
  const activeCustomers = useMemo(() => Object.values(customerStats).filter(c => c.salesCount > 0).length, [customerStats]);

  // Detail view
  const detail = selectedCustomer ? enriched.find(c => c._id === selectedCustomer) : null;
  const detailSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return salesData.filter(s => {
      const cid = typeof s.customer === "object" ? s.customer?._id : s.customer;
      return cid === selectedCustomer;
    }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [selectedCustomer, salesData]);

  const detailPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return paymentsData.filter(p => {
      const cid = typeof p.customer === "object" ? (p.customer as any)?._id : p.customer;
      return cid === selectedCustomer && (p.status === "pendente" || p.status === "atrasado");
    });
  }, [selectedCustomer, paymentsData]);

  return (
    <div className="flex flex-col">
      <AppHeader title="CRM — Relacionamento com Clientes" />
      <div className="flex-1 space-y-6 p-6">

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Clientes</p><p className="text-xl font-bold">{totalCustomers}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><DollarSign className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Total</p><p className="text-xl font-bold">R$ {totalRevenue.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShoppingCart className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio / Cliente</p><p className="text-xl font-bold">R$ {avgTicket.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><TrendingUp className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clientes Ativos</p><p className="text-xl font-bold">{activeCustomers}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </CardHeader>
          <CardContent>
            {customers.isLoading ? <Skeleton className="h-64 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Pendências</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          {c.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{c.stats.salesCount}</TableCell>
                      <TableCell className="text-right text-sm font-medium">R$ {c.stats.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">R$ {c.stats.salesCount ? (c.stats.totalSales / c.stats.salesCount).toFixed(2) : "0.00"}</TableCell>
                      <TableCell className="text-sm">{c.stats.lastSale ? new Date(c.stats.lastSale).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        {c.stats.pendingCount > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">{c.stats.pendingCount} — R$ {c.stats.pendingAmount.toFixed(2)}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-success/15 text-success">Em dia</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(c._id)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{detail?.name || "Cliente"}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {detail.email || "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {detail.phone || "—"}</div>
                <div><span className="text-muted-foreground">Endereço:</span> {detail.address || "—"}</div>
                <div><span className="text-muted-foreground">Total Gasto:</span> <span className="font-bold">R$ {detail.stats.totalSales.toFixed(2)}</span></div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Histórico de Compras ({detailSales.length})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailSales.slice(0, 20).map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="text-right text-sm font-medium">R$ {s.totalValue?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {detailSales.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">Nenhuma compra.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>

              {detailPayments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-destructive">Pendências ({detailPayments.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailPayments.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                          <TableCell className="text-sm">{p.description}</TableCell>
                          <TableCell className="text-right text-sm font-medium">R$ {p.amount?.toFixed(2)}</TableCell>
                          <TableCell><Badge variant={p.status === "atrasado" ? "destructive" : "secondary"} className="text-[10px]">{p.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
