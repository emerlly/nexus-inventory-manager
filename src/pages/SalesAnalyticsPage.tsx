import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { analyticsService, saleService, productService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon, DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  Package, Users, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { Sale } from "@/types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(215, 70%, 60%)",
  "hsl(280, 60%, 55%)",
];

const PERIOD_SHORTCUTS = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

function MetricCard({ title, value, change, icon: Icon, variant = "default" }: {
  title: string; value: string; change?: number; icon: React.ElementType; variant?: "default" | "success" | "warning"
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
          variant === "warning" ? "bg-warning/10 text-warning" : variant === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${change >= 0 ? "text-success" : "text-destructive"}`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% vs período anterior
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

  const salesByPeriod = useQuery({
    queryKey: ["analytics", "salesByPeriod", startStr, endStr],
    queryFn: () => analyticsService.salesByPeriod(startStr, endStr),
  });

  const prevPeriod = useQuery({
    queryKey: ["analytics", "salesByPeriod", prevStart, prevEnd],
    queryFn: () => analyticsService.salesByPeriod(prevStart, prevEnd),
  });

  const profitByPeriod = useQuery({
    queryKey: ["analytics", "profitByPeriod", startStr, endStr],
    queryFn: () => analyticsService.profitByPeriod(startStr, endStr),
  });

  const topProducts = useQuery({
    queryKey: ["analytics", "topProducts", startStr, endStr],
    queryFn: () => analyticsService.salesByProduct(startStr, endStr, 10),
  });

  const salesByUser = useQuery({
    queryKey: ["analytics", "salesByUser"],
    queryFn: () => analyticsService.salesByUser(),
  });

  const allSales = useQuery({
    queryKey: ["sales"],
    queryFn: saleService.getAll,
  });

  const stockAlerts = useQuery({
    queryKey: ["analytics", "stockLow"],
    queryFn: () => analyticsService.stockLow(),
  });

  const periodData = salesByPeriod.data as any[] | undefined;
  const prevData = prevPeriod.data as any[] | undefined;
  const profitData = profitByPeriod.data as any[] | undefined;
  const topProdData = topProducts.data as any[] | undefined;
  const salesUserData = salesByUser.data as any[] | undefined;
  const salesData = allSales.data as Sale[] | undefined;
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

  const setShortcut = (d: number) => {
    setStartDate(subDays(new Date(), d));
    setEndDate(new Date());
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="Análise de Vendas" />
      <div className="flex-1 space-y-6 p-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {PERIOD_SHORTCUTS.map((s) => (
            <Button key={s.days} variant="outline" size="sm" onClick={() => setShortcut(s.days)}>{s.label}</Button>
          ))}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start">
                  <CalendarIcon className="mr-2 h-3 w-3" />{format(startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-sm text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start">
                  <CalendarIcon className="mr-2 h-3 w-3" />{format(endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Faturamento" value={`R$ ${revenue.toFixed(2)}`} change={revenueChange} icon={DollarSign} variant="success" />
          <MetricCard title="Lucro Bruto" value={`R$ ${profit.toFixed(2)}`} change={profitChange} icon={TrendingUp} variant="success" />
          <MetricCard title="Ticket Médio" value={`R$ ${ticket.toFixed(2)}`} icon={ShoppingCart} />
          <MetricCard title="Margem Bruta" value={`${margin.toFixed(1)}%`} icon={Target} variant={margin >= 30 ? "success" : "warning"} />
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
            <TabsTrigger value="profit">Lucro</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="sellers">Vendedores</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Faturamento por Período</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={periodData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Evolução Acumulada</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={periodData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" name="Receita" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profit">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Lucro por Período</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {profitByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Receita" strokeWidth={2} />
                        <Line type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" name="Custo" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" name="Lucro" strokeWidth={2} />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Margem de Lucro</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {profitByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(profitData || []).map((d: any) => ({ ...d, margin: d.revenue > 0 ? ((d.profit / d.revenue) * 100) : 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} unit="%" />
                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                        <Bar dataKey="margin" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Margem %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Top Produtos por Vendas</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {topProducts.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProdData || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="product" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Valor" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Distribuição por Produto</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {topProducts.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topProdData || []} dataKey="total" nameKey="product" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {(topProdData || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sellers">
            <Card>
              <CardHeader><CardTitle className="text-base">Vendas por Vendedor</CardTitle></CardHeader>
              <CardContent>
                {salesByUser.isLoading ? <Skeleton className="h-64 w-full" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Nº Vendas</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(salesUserData || []).map((u: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{u.user}</TableCell>
                          <TableCell className="text-right">{u.count}</TableCell>
                          <TableCell className="text-right">R$ {u.total?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {u.count ? (u.total / u.count).toFixed(2) : "0.00"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <Card>
              <CardHeader><CardTitle className="text-base">Alertas de Estoque Baixo</CardTitle></CardHeader>
              <CardContent>
                {stockAlerts.isLoading ? <Skeleton className="h-64 w-full" /> : !stockData?.length ? (
                  <p className="py-8 text-center text-muted-foreground">Nenhum produto com estoque crítico.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Estoque Atual</TableHead>
                        <TableHead className="text-right">Estoque Mínimo</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(stockData || []).map((p: any) => (
                        <TableRow key={p._id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                          <TableCell className="text-right">{p.minStock}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={p.quantity <= 0 ? "destructive" : "secondary"} className={p.quantity > 0 ? "bg-warning/15 text-warning" : ""}>
                              {p.quantity <= 0 ? "Sem estoque" : "Baixo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
