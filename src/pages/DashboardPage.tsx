import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon, DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight, Eye,
  CreditCard, Package, BarChart3,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { analyticsService, saleService, paymentService, productService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Sale, Payment } from "@/types";

const PERIOD_SHORTCUTS = [
  { label: "7d", days: 7 },
  { label: "15d", days: 15 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

/* ─── KPI Card ─── */
function KpiCard({ title, value, sub, icon: Icon, variant = "default", onClick, badge }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger"; onClick?: () => void; badge?: string;
}) {
  const colors = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className={cn("relative overflow-hidden", onClick && "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5")} onClick={onClick}>
      {badge && <Badge className="absolute top-3 right-3 text-[10px]" variant="secondary">{badge}</Badge>}
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", colors[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Drill-down list dialog ─── */
function ListDialog({ open, onOpenChange, title, items, columns }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string;
  items: any[]; columns: { key: string; label: string; render?: (v: any) => string }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : items.map((item, i) => (
              <TableRow key={i}>
                {columns.map(c => (
                  <TableCell key={c.key}>{c.render ? c.render(item) : item[c.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(() => subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [listDialog, setListDialog] = useState<{ title: string; items: any[]; columns: any[] } | null>(null);

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const prevStart = format(subDays(startDate, days), "yyyy-MM-dd");
  const prevEnd = format(subDays(startDate, 1), "yyyy-MM-dd");

  // Queries
  const salesByPeriod = useQuery({ queryKey: ["analytics", "salesByPeriod", startStr, endStr], queryFn: () => analyticsService.salesByPeriod(startStr, endStr) });
  const prevPeriod = useQuery({ queryKey: ["analytics", "salesByPeriod", prevStart, prevEnd], queryFn: () => analyticsService.salesByPeriod(prevStart, prevEnd) });
  const profitByPeriod = useQuery({ queryKey: ["analytics", "profitByPeriod", startStr, endStr], queryFn: () => analyticsService.profitByPeriod(startStr, endStr) });
  const stockAlerts = useQuery({ queryKey: ["analytics", "stockLow"], queryFn: () => analyticsService.stockLow() });
  const allSales = useQuery({ queryKey: ["sales"], queryFn: saleService.getAll });
  const allPayments = useQuery({ queryKey: ["payments"], queryFn: paymentService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });

  const periodData = salesByPeriod.data as any[] | undefined;
  const prevData = prevPeriod.data as any[] | undefined;
  const profitData = profitByPeriod.data as any[] | undefined;
  const stockData = stockAlerts.data as any[] | undefined;
  const salesData = (allSales.data || []) as Sale[];
  const paymentsData = (allPayments.data || []) as Payment[];

  // KPIs
  const revenue = useMemo(() => periodData?.reduce((s: number, p: any) => s + (p.revenue || 0), 0) ?? 0, [periodData]);
  const prevRevenue = useMemo(() => prevData?.reduce((s: number, p: any) => s + (p.revenue || 0), 0) ?? 0, [prevData]);
  const profit = useMemo(() => profitData?.reduce((s: number, p: any) => s + (p.profit || 0), 0) ?? 0, [profitData]);
  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const salesCount = periodData?.length ?? 0;
  const ticket = salesCount ? revenue / salesCount : 0;
  const lowStockCount = stockData?.length ?? 0;

  // Cash flow from payments
  const totalReceitas = useMemo(() => paymentsData.filter(p => p.type === "receita" && p.status === "pago").reduce((s, p) => s + (p.amount || 0), 0), [paymentsData]);
  const totalDespesas = useMemo(() => paymentsData.filter(p => p.type === "despesa" && p.status === "pago").reduce((s, p) => s + (p.amount || 0), 0), [paymentsData]);
  const saldoCaixa = totalReceitas - totalDespesas;
  const pendingPayments = useMemo(() => paymentsData.filter(p => p.status === "pendente" || p.status === "atrasado"), [paymentsData]);

  // Biggest inflow/outflow
  const biggestInflow = useMemo(() => {
    const receitas = paymentsData.filter(p => p.type === "receita" && p.status === "pago");
    return receitas.length ? receitas.reduce((max, p) => p.amount > max.amount ? p : max, receitas[0]) : null;
  }, [paymentsData]);

  const biggestOutflow = useMemo(() => {
    const despesas = paymentsData.filter(p => p.type === "despesa" && p.status === "pago");
    return despesas.length ? despesas.reduce((max, p) => p.amount > max.amount ? p : max, despesas[0]) : null;
  }, [paymentsData]);

  const setShortcut = (d: number) => { setStartDate(subDays(new Date(), d)); setEndDate(new Date()); };

  // Drill-down helpers
  const showSales = () => setListDialog({
    title: "Todas as Vendas no Período",
    items: salesData.filter(s => {
      if (!s.createdAt) return false;
      const d = s.createdAt.split("T")[0];
      return d >= startStr && d <= endStr;
    }),
    columns: [
      { key: "createdAt", label: "Data", render: (s: Sale) => s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—" },
      { key: "customer", label: "Cliente", render: (s: Sale) => typeof s.customer === "object" ? s.customer?.name || "—" : "—" },
      { key: "totalValue", label: "Valor", render: (s: Sale) => `R$ ${s.totalValue?.toFixed(2)}` },
    ],
  });

  const showDespesas = () => setListDialog({
    title: "Saídas de Caixa (Despesas Pagas)",
    items: paymentsData.filter(p => p.type === "despesa" && p.status === "pago"),
    columns: [
      { key: "dueDate", label: "Data", render: (p: Payment) => p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—" },
      { key: "description", label: "Descrição" },
      { key: "amount", label: "Valor", render: (p: Payment) => `R$ ${p.amount?.toFixed(2)}` },
    ],
  });

  const showReceitas = () => setListDialog({
    title: "Entradas de Caixa (Receitas Pagas)",
    items: paymentsData.filter(p => p.type === "receita" && p.status === "pago"),
    columns: [
      { key: "dueDate", label: "Data", render: (p: Payment) => p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—" },
      { key: "description", label: "Descrição" },
      { key: "amount", label: "Valor", render: (p: Payment) => `R$ ${p.amount?.toFixed(2)}` },
    ],
  });

  const showPendencias = () => setListDialog({
    title: "Pendências de Pagamento",
    items: pendingPayments,
    columns: [
      { key: "dueDate", label: "Vencimento", render: (p: Payment) => p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—" },
      { key: "description", label: "Descrição" },
      { key: "type", label: "Tipo", render: (p: Payment) => p.type === "receita" ? "Receita" : "Despesa" },
      { key: "amount", label: "Valor", render: (p: Payment) => `R$ ${p.amount?.toFixed(2)}` },
      { key: "status", label: "Status" },
    ],
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_SHORTCUTS.map(s => (
            <Button key={s.days} variant="outline" size="sm" onClick={() => setShortcut(s.days)}>{s.label}</Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[140px] justify-start">
                <CalendarIcon className="mr-2 h-3 w-3" />{format(startDate, "dd/MM/yy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={d => d && setStartDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[140px] justify-start">
                <CalendarIcon className="mr-2 h-3 w-3" />{format(endDate, "dd/MM/yy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={d => d && setEndDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Row 1: Main KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Faturamento" value={`R$ ${revenue.toFixed(2)}`} sub={prevRevenue ? `${revenueChange >= 0 ? "↑" : "↓"} ${Math.abs(revenueChange).toFixed(1)}% vs anterior` : undefined}
            icon={DollarSign} variant={revenueChange >= 0 ? "success" : "warning"} onClick={showSales} badge="Clique p/ detalhar" />
          <KpiCard title="Lucro Bruto" value={`R$ ${profit.toFixed(2)}`} icon={TrendingUp} variant="success" onClick={() => navigate("/sales/analytics")} />
          <KpiCard title="Ticket Médio" value={`R$ ${ticket.toFixed(2)}`} icon={ShoppingCart} onClick={() => navigate("/sales/analytics")} />
          <KpiCard title="Estoque Crítico" value={lowStockCount} icon={AlertTriangle} variant={lowStockCount > 0 ? "danger" : "default"} onClick={() => navigate("/stock/movements")} />
        </div>

        {/* Row 2: Cash Flow KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Fluxo de Caixa
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Saldo de Caixa" value={`R$ ${saldoCaixa.toFixed(2)}`} icon={Wallet} variant={saldoCaixa >= 0 ? "success" : "danger"} onClick={() => navigate("/cashflow")} />
            <KpiCard title="Entradas" value={`R$ ${totalReceitas.toFixed(2)}`} icon={ArrowUpRight} variant="success" onClick={showReceitas} badge="Detalhar" />
            <KpiCard title="Saídas" value={`R$ ${totalDespesas.toFixed(2)}`} icon={ArrowDownRight} variant="danger" onClick={showDespesas} badge="Detalhar" />
            <KpiCard title="Pendências" value={pendingPayments.length} sub={`R$ ${pendingPayments.reduce((s, p) => s + (p.amount || 0), 0).toFixed(2)}`}
              icon={CreditCard} variant={pendingPayments.length > 0 ? "warning" : "default"} onClick={showPendencias} badge="Detalhar" />
          </div>
        </div>

        {/* Row 3: Highlights */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard title="Maior Entrada" value={biggestInflow ? `R$ ${biggestInflow.amount.toFixed(2)}` : "—"} sub={biggestInflow?.description} icon={TrendingUp} variant="success" />
          <KpiCard title="Maior Saída" value={biggestOutflow ? `R$ ${biggestOutflow.amount.toFixed(2)}` : "—"} sub={biggestOutflow?.description} icon={TrendingDown} variant="danger" />
          <KpiCard title="Produtos" value={products.data?.length ?? 0} icon={Package} onClick={() => navigate("/products")} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Faturamento por Período</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Lucro por Período</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {profitByPeriod?.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Area type="monotone" dataKey="profit" fill="hsl(var(--success))" fillOpacity={0.15} stroke="hsl(var(--success))" name="Lucro" />
                    <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.1} stroke="hsl(var(--primary))" name="Receita" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales snapshot */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas Vendas</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sales")}>Ver todas</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.slice(0, 5).map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>{typeof s.customer === "object" ? s.customer?.name || "—" : "—"}</TableCell>
                    <TableCell className="text-right font-medium">R$ {s.totalValue?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {salesData.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhuma venda registrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down dialog */}
      {listDialog && (
        <ListDialog
          open={!!listDialog}
          onOpenChange={() => setListDialog(null)}
          title={listDialog.title}
          items={listDialog.items}
          columns={listDialog.columns}
        />
      )}
    </div>
  );
}
