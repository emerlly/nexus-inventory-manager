import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { paymentService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import type { Payment } from "@/types";

const SHORTCUTS = [{ label: "7d", days: 7 }, { label: "15d", days: 15 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }];

export default function CashFlowPage() {
  const [startDate, setStartDate] = useState<Date>(() => subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [tab, setTab] = useState("all");

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const { data: rawData = [], isLoading } = useQuery({ queryKey: ["payments"], queryFn: paymentService.getAll });
  const payments = rawData as Payment[];

  // Filter by date
  const filtered = useMemo(() => payments.filter(p => {
    const d = (p.dueDate || p.createdAt || "").split("T")[0];
    return d >= startStr && d <= endStr;
  }), [payments, startStr, endStr]);

  const byTab = tab === "all" ? filtered : filtered.filter(p => p.type === tab);

  const totalReceitas = useMemo(() => filtered.filter(p => p.type === "Receita" && p.status === "Pago").reduce((s, p) => s + (p.amount || 0), 0), [filtered]);
  const totalDespesas = useMemo(() => filtered.filter(p => p.type === "Despesa" && p.status === "Pago").reduce((s, p) => s + (p.amount || 0), 0), [filtered]);
  const saldo = totalReceitas - totalDespesas;
  const pending = useMemo(() => filtered.filter(p => p.status === "Pendente" || p.status === "Atrasado"), [filtered]);
  const overdue = useMemo(() => filtered.filter(p => p.status === "Atrasado"), [filtered]);

  // Chart: group by month
  const chartData = useMemo(() => {
    const map: Record<string, { period: string; receitas: number; despesas: number; saldo: number }> = {};
    filtered.forEach(p => {
      if (p.status !== "Pago") return;
      const month = (p.dueDate || p.createdAt || "").substring(0, 7);
      if (!map[month]) map[month] = { period: month, receitas: 0, despesas: 0, saldo: 0 };
      if (p.type === "Receita") map[month].receitas += p.amount || 0;
      else map[month].despesas += p.amount || 0;
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period)).map(d => ({ ...d, saldo: d.receitas - d.despesas }));
  }, [filtered]);

  // Accumulated saldo
  const accData = useMemo(() => {
    let acc = 0;
    return chartData.map(d => { acc += d.saldo; return { ...d, accumulated: acc }; });
  }, [chartData]);

  const setShortcut = (d: number) => { setStartDate(subDays(new Date(), d)); setEndDate(new Date()); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Fluxo de Caixa" />
      <div className="flex-1 space-y-6 p-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {SHORTCUTS.map(s => <Button key={s.days} variant="outline" size="sm" onClick={() => setShortcut(s.days)}>{s.label}</Button>)}
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-[140px] justify-start"><CalendarIcon className="mr-2 h-3 w-3" />{format(startDate, "dd/MM/yy")}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={d => d && setStartDate(d)} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">até</span>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-[140px] justify-start"><CalendarIcon className="mr-2 h-3 w-3" />{format(endDate, "dd/MM/yy")}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={d => d && setEndDate(d)} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><ArrowUpRight className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entradas</p><p className="text-xl font-bold">R$ {totalReceitas.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><ArrowDownRight className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas</p><p className="text-xl font-bold">R$ {totalDespesas.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${saldo >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                <Wallet className="h-5 w-5" />
              </div>
              <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo</p><p className="text-xl font-bold">R$ {saldo.toFixed(2)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${overdue.length > 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendências</p>
                <p className="text-xl font-bold">{pending.length}</p>
                {overdue.length > 0 && <p className="text-[11px] text-destructive">{overdue.length} atrasado(s)</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Entradas vs Saídas</CardTitle></CardHeader>
            <CardContent className="h-64">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Entradas" />
                    <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Saídas" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Saldo Acumulado</CardTitle></CardHeader>
            <CardContent className="h-64">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Area type="monotone" dataKey="accumulated" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} name="Saldo Acumulado" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Movimentações</CardTitle>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                <TabsTrigger value="receita" className="text-xs">Entradas</TabsTrigger>
                <TabsTrigger value="despesa" className="text-xs">Saídas</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTab.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro.</TableCell></TableRow>
                ) : byTab.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || "")).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-sm">{p.description}</TableCell>
                    <TableCell><Badge variant={p.type === "Receita" ? "default" : "secondary"} className="text-[10px]">{p.type === "Receita" ? "Entrada" : "Saída"}</Badge></TableCell>
                    <TableCell className={`text-right font-medium text-sm ${p.type === "Receita" ? "text-success" : "text-destructive"}`}>
                      {p.type === "Receita" ? "+" : "-"} R$ {p.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Pago" ? "default" : p.status === "Atrasado" ? "destructive" : "secondary"} className="text-[10px]">
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
