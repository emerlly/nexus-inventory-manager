import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { analyticsService, saleService, paymentService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon, DollarSign, TrendingUp, ShoppingCart, Target,
  ArrowUpRight, ArrowDownRight, AlertTriangle,
} from "lucide-react";
import type { Sale, Payment } from "@/types";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(215,70%,60%)", "hsl(280,60%,55%)", "hsl(340,65%,50%)", "hsl(170,55%,45%)", "hsl(45,80%,55%)", "hsl(200,60%,50%)"];
const SHORTCUTS = [{ label: "7d", days: 7 }, { label: "15d", days: 15 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }];

function Metric({ title, value, change, icon: Icon, variant = "default" }: {
  title: string; value: string; change?: number; icon: React.ElementType; variant?: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${variant === "warning" ? "bg-warning/10 text-warning" : variant === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${change >= 0 ? "text-success" : "text-destructive"}`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% vs anterior
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesAnalyticsPage() {
  const [startDate, setStartDate] = useState<Date>(() => subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const prevStart = format(subDays(startDate, days), "yyyy-MM-dd");
  const prevEnd = format(subDays(startDate, 1), "yyyy-MM-dd");

  const salesByPeriod = useQuery({ queryKey: ["analytics", "salesByPeriod", startStr, endStr], queryFn: () => analyticsService.salesByPeriod(startStr, endStr) });
  const prevPeriod = useQuery({ queryKey: ["analytics", "salesByPeriod", prevStart, prevEnd], queryFn: () => analyticsService.salesByPeriod(prevStart, prevEnd) });
  const profitByPeriod = useQuery({ queryKey: ["analytics", "profitByPeriod", startStr, endStr], queryFn: () => analyticsService.profitByPeriod(startStr, endStr) });
  const topProducts = useQuery({ queryKey: ["analytics", "topProducts", startStr, endStr], queryFn: () => analyticsService.salesByProduct(startStr, endStr, 10) });
  const salesByUser = useQuery({ queryKey: ["analytics", "salesByUser"], queryFn: () => analyticsService.salesByUser() });
  const allSales = useQuery({ queryKey: ["sales"], queryFn: saleService.getAll });
  const allPayments = useQuery({ queryKey: ["payments"], queryFn: paymentService.getAll });
  const stockAlerts = useQuery({ queryKey: ["analytics", "stockLow"], queryFn: () => analyticsService.stockLow() });

  const periodData = salesByPeriod.data as any[] | undefined;
  const prevData = prevPeriod.data as any[] | undefined;
  const profitData = profitByPeriod.data as any[] | undefined;
  const topProdData = topProducts.data as any[] | undefined;
  const salesUserData = salesByUser.data as any[] | undefined;
  const salesData = (allSales.data || []) as Sale[];
  const paymentsData = (allPayments.data || []) as Payment[];
  const stockData = stockAlerts.data as any[] | undefined;

  const revenue = useMemo(() => periodData?.reduce((s: number, p: any) => s + (p.revenue || 0), 0) ?? 0, [periodData]);
  const prevRevenue = useMemo(() => prevData?.reduce((s: number, p: any) => s + (p.revenue || 0), 0) ?? 0, [prevData]);
  const profit = useMemo(() => profitData?.reduce((s: number, p: any) => s + (p.profit || 0), 0) ?? 0, [profitData]);
  const prevProfit = useMemo(() => prevData?.reduce((s: number, p: any) => s + (p.profit || 0), 0) ?? 0, [prevData]);
  const salesCount = periodData?.length ?? 0;
  const ticket = salesCount ? revenue / salesCount : 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const profitChange = prevProfit > 0 ? ((profit - prevProfit) / prevProfit) * 100 : 0;

  // Last 10 sales
  const last10 = useMemo(() => [...salesData].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 10), [salesData]);

  // Pending payments
  const pendingPayments = useMemo(() => paymentsData.filter(p => p.status === "pendente" || p.status === "atrasado"), [paymentsData]);

  // Growth chart data
  const growthData = useMemo(() => {
    if (!periodData?.length) return [];
    let acc = 0;
    return periodData.map((d: any) => { acc += d.revenue || 0; return { ...d, accumulated: acc }; });
  }, [periodData]);

  const setShortcut = (d: number) => { setStartDate(subDays(new Date(), d)); setEndDate(new Date()); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Controle de Vendas" />
      <div className="flex-1 space-y-6 p-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {SHORTCUTS.map(s => <Button key={s.days} variant="outline" size="sm" onClick={() => setShortcut(s.days)}>{s.label}</Button>)}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[140px] justify-start"><CalendarIcon className="mr-2 h-3 w-3" />{format(startDate, "dd/MM/yy")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={d => d && setStartDate(d)} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[140px] justify-start"><CalendarIcon className="mr-2 h-3 w-3" />{format(endDate, "dd/MM/yy")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={d => d && setEndDate(d)} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="Faturamento" value={`R$ ${revenue.toFixed(2)}`} change={revenueChange} icon={DollarSign} variant="success" />
          <Metric title="Lucro Bruto" value={`R$ ${profit.toFixed(2)}`} change={profitChange} icon={TrendingUp} variant="success" />
          <Metric title="Ticket Médio" value={`R$ ${ticket.toFixed(2)}`} icon={ShoppingCart} />
          <Metric title="Margem Bruta" value={`${margin.toFixed(1)}%`} icon={Target} variant={margin >= 30 ? "success" : "warning"} />
        </div>

        {/* Growth + Revenue Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Crescimento Acumulado</CardTitle></CardHeader>
            <CardContent className="h-64">
              {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Area type="monotone" dataKey="accumulated" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} name="Acumulado" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Receita vs Custo vs Lucro</CardTitle></CardHeader>
            <CardContent className="h-64">
              {profitByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" strokeWidth={2} name="Custo" />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} name="Lucro" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products + Pie */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 Produtos</CardTitle></CardHeader>
            <CardContent className="h-72">
              {topProducts.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(topProdData || []).slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="product" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por Produto</CardTitle></CardHeader>
            <CardContent className="h-72">
              {topProducts.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(topProdData || []).slice(0, 10)} dataKey="total" nameKey="product" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {(topProdData || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Last 10 Sales + Pending Payments + Sellers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Last 10 Sales */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Últimas 10 Vendas</CardTitle></CardHeader>
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
                  {last10.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm">{typeof s.customer === "object" ? s.customer?.name || "—" : "—"}</TableCell>
                      <TableCell className="text-right font-medium text-sm">R$ {s.totalValue?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {last10.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Sem vendas.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Pendências de Pagamento
                {pendingPayments.length > 0 && <Badge variant="destructive" className="text-[10px]">{pendingPayments.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.slice(0, 10).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm">{p.description}</TableCell>
                      <TableCell><Badge variant={p.type === "receita" ? "default" : "secondary"} className="text-[10px]">{p.type === "receita" ? "Receita" : "Despesa"}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-sm">R$ {p.amount?.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={p.status === "atrasado" ? "destructive" : "secondary"} className="text-[10px]">{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {pendingPayments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma pendência.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sellers + Stock */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Vendedor</CardTitle></CardHeader>
            <CardContent>
              {salesByUser.isLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead className="text-right">Vendas</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Média</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(salesUserData || []).map((u: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{u.user}</TableCell>
                        <TableCell className="text-right text-sm">{u.count}</TableCell>
                        <TableCell className="text-right text-sm">R$ {u.total?.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm">R$ {u.count ? (u.total / u.count).toFixed(2) : "0.00"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Estoque Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockAlerts.isLoading ? <Skeleton className="h-48 w-full" /> : !stockData?.length ? (
                <p className="py-8 text-center text-muted-foreground text-sm">Nenhum alerta.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Atual</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(stockData || []).slice(0, 10).map((p: any) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-right text-sm">{p.quantity}</TableCell>
                        <TableCell className="text-right text-sm">{p.minStock}</TableCell>
                        <TableCell><Badge variant={p.quantity <= 0 ? "destructive" : "secondary"} className={`text-[10px] ${p.quantity > 0 ? "bg-warning/15 text-warning" : ""}`}>{p.quantity <= 0 ? "Sem estoque" : "Baixo"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
