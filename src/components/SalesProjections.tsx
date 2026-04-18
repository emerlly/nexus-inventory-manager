import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsService, type SalesProjections as SalesProjectionsType } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesProjectionsProps {
  className?: string;
}

export function SalesProjections({ className }: SalesProjectionsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "salesProjections"],
    queryFn: () => analyticsService.getSalesProjections(),
  });

  const projections = useMemo(() => data || ({
    projectedAnnualRevenue: 0,
    totalSold: 0,
    monthlyGoal: 0,
    breakEvenPoint: 0,
    monthlySales: [],
    dailyGoalPercentage: 0,
    annualGoalAchievedPercentage: 0,
    totalSalesThisMonth: 0,
  } as SalesProjectionsType), [data]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="flex items-center gap-2 p-5 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar projeções de vendas</span>
        </CardContent>
      </Card>
    );
  }

  const monthlyGoalPercentage = projections.projectedAnnualRevenue > 0
    ? (projections.totalSalesThisMonth / projections.monthlyGoal) * 100
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projeção de Vendas</h2>
          <p className="text-sm text-muted-foreground">Análise de metas e desempenho</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Receita Anual Projetada */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Anual Projetada</p>
              <p className="text-xl font-bold truncate">R$ {projections.projectedAnnualRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Total Vendido */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resumo Total Vendido</p>
              <p className="text-xl font-bold truncate">R$ {projections.totalSold.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
              <p className="text-[11px] text-success mt-0.5">{projections.annualGoalAchievedPercentage.toFixed(1)}% da meta</p>
            </div>
          </CardContent>
        </Card>

        {/* Meta a Bater no Mês */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta a Bater no Mês</p>
              <p className="text-xl font-bold truncate">R$ {projections.monthlyGoal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Vendido: R$ {projections.totalSalesThisMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ponto de Equilíbrio */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ponto de Equilíbrio</p>
              <p className="text-xl font-bold truncate">R$ {projections.breakEvenPoint.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {projections.totalSold >= projections.breakEvenPoint ? (
                  <span className="text-success">✓ Acima do ponto</span>
                ) : (
                  <span className="text-destructive">✗ Abaixo do ponto</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Meta Diária */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Percentual para a Meta Diária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso</span>
                <Badge variant={projections.dailyGoalPercentage >= 100 ? "default" : "secondary"}>
                  {projections.dailyGoalPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={Math.min(projections.dailyGoalPercentage, 100)} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              {projections.dailyGoalPercentage >= 100
                ? "Meta diária alcançada!"
                : `Faltam ${(100 - projections.dailyGoalPercentage).toFixed(1)}% para atingir a meta`}
            </p>
          </CardContent>
        </Card>

        {/* Meta Anual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total da Meta Anual Alcançada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso</span>
                <Badge variant={projections.annualGoalAchievedPercentage >= 100 ? "default" : "secondary"}>
                  {projections.annualGoalAchievedPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={Math.min(projections.annualGoalAchievedPercentage, 100)} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              {projections.annualGoalAchievedPercentage >= 100
                ? "Meta anual alcançada!"
                : `Faltam R$ ${(projections.projectedAnnualRevenue - projections.totalSold).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} para atingir a meta`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Sales Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vendas Mensais (Ano Atual)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {projections.monthlySales.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projections.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}