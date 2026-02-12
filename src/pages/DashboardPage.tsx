import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { reportService, productService } from "@/services";
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


function StatCard({ title, value, icon: Icon, variant = "default" }: {
  title: string; value: string | number; icon: React.ElementType; variant?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${variant === "warning" ? "bg-warning/10 text-warning" :
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
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const products = useQuery({ queryKey: ["products"], queryFn: () => productService.getAll() });
  const salesByProduct = useQuery({ queryKey: ["reports", "salesByProduct"], queryFn: reportService.salesByProduct });
  const stockLow = useQuery({ queryKey: ["reports", "stockLow"], queryFn: reportService.stockLow });
  const salesByPeriod = useQuery({
    queryKey: ["reports", "salesByPeriod", startStr, endStr],
    queryFn: () => reportService.salesByPeriod(startStr, endStr),
  });

  const totalProducts = products.data?.length ?? 0;
  const totalStock = products.data?.reduce((s, p) => s + (p.stockQuantity || 0), 0) ?? 0;
  const lowStockCount = stockLow.data?.length ?? 0;

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total de Produtos" value={totalProducts} icon={Package} />
          <StatCard title="Quantidade em Estoque" value={totalStock} icon={Package} variant="success" />
          <StatCard title="Vendas no Período" value={salesByPeriod.data?.length ?? "—"} icon={ShoppingCart} />
          <StatCard title="Estoque Baixo" value={lowStockCount} icon={AlertTriangle} variant="warning" />
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
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
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Vendas por Período</CardTitle></CardHeader>
            <CardContent className="h-72">
              {salesByPeriod.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByPeriod.data || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="profit" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vendas por Produto</CardTitle></CardHeader>
            <CardContent className="h-72">
              {salesByProduct.isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByProduct.data || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="product" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Estoque Baixo</CardTitle></CardHeader>
            <CardContent>
              {stockLow.isLoading ? <Skeleton className="h-48 w-full" /> : !stockLow.data?.length ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum produto com estoque baixo!</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {stockLow.data.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between rounded-md border p-3">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive font-semibold">{item.quantity}</span>
                        <span className="text-xs text-muted-foreground">/ mín: {item.minStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
