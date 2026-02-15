import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { reportService, productService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${variant === "warning"
              ? "bg-warning/10 text-warning"
              : variant === "success"
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary"
            }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  // período anterior automático
  const days = differenceInDays(endDate, startDate);
  const prevStart = format(subDays(startDate, days + 1), "yyyy-MM-dd");
  const prevEnd = format(subDays(startDate, 1), "yyyy-MM-dd");

  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getAll(),
  });

  const salesByProduct = useQuery({
    queryKey: ["reports", "salesByProduct"],
    queryFn: reportService.salesByProduct,
  });

  const stockLow = useQuery({
    queryKey: ["reports", "stockLow"],
    queryFn: reportService.stockLow,
  });

  const salesByPeriod = useQuery({
    queryKey: ["reports", "salesByPeriod", startStr, endStr],
    queryFn: () => reportService.salesByPeriod(startStr, endStr),
  });

  // comparação
  const previousPeriod = useQuery({
    queryKey: ["reports", "salesByPeriod", prevStart, prevEnd],
    queryFn: () => reportService.salesByPeriod(prevStart, prevEnd),
  });

  // hoje
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const today = useQuery({
    queryKey: ["reports", "salesByPeriod", todayStr, todayStr],
    queryFn: () => reportService.salesByPeriod(todayStr, todayStr),
  });

  // =====================
  // Cálculos inteligentes
  // =====================

  const revenue = useMemo(
    () => salesByPeriod.data?.reduce((s, p) => s + (p.revenue || 0), 0) ?? 0,
    [salesByPeriod.data]
  );


  const profit = useMemo(
    () => salesByPeriod.data?.reduce((s, p) => s + (p.profit || 0), 0) ?? 0,
    [salesByPeriod.data]
  );

  const salesCount = salesByPeriod.data?.length ?? 0;
  const ticket = salesCount ? revenue / salesCount : 0;

  const previousRevenue =
    previousPeriod.data?.reduce((s, p) => s + (p.revenue || 0), 0) ?? 0;

  const diff =
    previousRevenue > 0
      ? ((revenue - previousRevenue) / previousRevenue) * 100
      : 0;

  const totalProducts = products.data?.length ?? 0;
  const lowStockCount = stockLow.data?.length ?? 0;

  const todayRevenue =
    today.data?.reduce((s, p) => s + (p.revenue || 0), 0) ?? 0;

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />

      <div className="flex-1 space-y-6 p-6">
        {/* ================= KPI PRINCIPAL ================= */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Faturamento"
            value={`R$ ${revenue.toFixed(2)}`}
            sub={
              previousRevenue
                ? `${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(
                  1
                )}% vs período anterior`
                : undefined
            }
            icon={DollarSign}
            variant={diff >= 0 ? "success" : "warning"}
          />

          <StatCard
            title="Lucro"
            value={`R$ ${profit.toFixed(2)}`}
            icon={TrendingUp}
            variant="success"
          />

          <StatCard
            title="Ticket Médio"
            value={`R$ ${ticket.toFixed(2)}`}
            icon={ShoppingCart}
          />

          <StatCard
            title="Estoque Crítico"
            value={lowStockCount}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* ================= HOJE ================= */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Faturamento Hoje"
            value={`R$ ${todayRevenue.toFixed(2)}`}
            icon={DollarSign}
          />
          <StatCard
            title="Produtos Cadastrados"
            value={totalProducts}
            icon={ShoppingCart}
          />
        </div>

        {/* ================= FILTRO ================= */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Período:
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => d && setEndDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* ================= GRÁFICOS ================= */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Período</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {salesByPeriod.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByPeriod.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lucro por Período</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {salesByPeriod.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByPeriod.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="profit" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
