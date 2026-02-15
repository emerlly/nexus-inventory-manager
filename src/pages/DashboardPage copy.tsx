import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, DollarSign, TrendingUp, ShoppingCart, AlertTriangle } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { productService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { analyticsService } from "@/services";
import { C } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";


function StatCard({ title, value, icon: Icon, variant = "default" }: {
  title: string; value: string | number; icon: React.ElementType; variant?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
          variant === "warning" ? "bg-warning/10 text-warning" :
          variant === "success" ? "bg-success/10 text-success" :
          "bg-primary/10 text-primary"
        }`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
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

  // produtos
  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getAll(),
  });

  //  DASHBOARD OFICIAL
  const dashboard = useQuery({
    queryKey: ["dashboard", startStr, endStr],
    queryFn: () => analyticsService.summary(startStr, endStr),
  });


  // gráficos auxiliares
  const salesByPeriod = useQuery({
    queryKey: ["dashboard", startStr, endStr],
    queryFn: () => analyticsService.salesByPeriod(startStr, endStr),
  });

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () => analyticsService.stockLow(),
  });
  
  const profitByPeriod = useQuery({
    queryKey: ["dashboard", startStr, endStr],
    queryFn: () => analyticsService.profitByPeriod(startStr, endStr),
  }); 


  // dados vindos PRONTOS do backend
  const receita = dashboard.data?.revenue ?? 0;
  const profit = salesByPeriod.data?.profit ?? 0;
  const salesCount = dashboard.data?.salesCount ?? 0;
  const ticket = dashboard.data?.ticketAverage ?? 0;
  const todayRevenue = dashboard.data?.today?.revenue ?? 0;

  
  const lowStockCount = dashboard.data?.stock?.low ?? 0;
  
  const totalProducts = products.data?.length ?? 0;
  const totalStock =
  products.data?.reduce((s, p) => s + (p.stockQuantity || 0), 0) ?? 0;
  

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />

      <div className="flex-1 space-y-6 p-6">
        {/* ================= KPIs ================= */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Faturamento" value={`R$ ${receita.toFixed(2)}`} icon={DollarSign} />
          <StatCard title="Lucro" value={`R$ ${profit.toFixed(4)}`} icon={TrendingUp} variant="success" />
          <StatCard title="Vendas" value={salesCount} icon={ShoppingCart} />
          <StatCard title="Ticket Médio" value={`R$ ${ticket.toFixed(2)}`} icon={DollarSign} />
        </div>

        {/* ================= EXTRA ================= */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Faturamento Hoje" value={`R$ ${todayRevenue.toFixed(2)}`} icon={DollarSign} />
          <StatCard title="Produtos Cadastrados" value={totalProducts} icon={Package} />
          <StatCard title="Estoque Baixo" value={lowStockCount} icon={AlertTriangle} variant="warning" />
        </div>

        {/* ================= FILTRO ================= */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        {/* ================= GRÁFICOS ================= */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Vendas por Período</CardTitle></CardHeader>
            <CardContent className="h-72">
              {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByPeriod.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="receita" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lucro por Período</CardTitle></CardHeader>
            <CardContent className="h-72">
              {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
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
