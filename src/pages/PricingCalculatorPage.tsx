import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Target, DollarSign, Percent, BarChart3, Package } from "lucide-react";

function ResultCard({ label, value, sub, variant = "default" }: { label: string; value: string; sub?: string; variant?: "default" | "success" | "warning" | "destructive" }) {
  const colors = {
    default: "border-border",
    success: "border-success/40 bg-success/5",
    warning: "border-warning/40 bg-warning/5",
    destructive: "border-destructive/40 bg-destructive/5",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[variant]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function PricingCalculatorPage() {
  // Markup / Margem
  const [costPrice, setCostPrice] = useState(0);
  const [desiredMargin, setDesiredMargin] = useState(30);
  const [fixedCosts, setFixedCosts] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [commission, setCommission] = useState(0);

  // Ponto de equilíbrio
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(0);
  const [avgSalePrice, setAvgSalePrice] = useState(0);
  const [avgVariableCost, setAvgVariableCost] = useState(0);

  // Comparador
  const [compCost, setCompCost] = useState(0);
  const [compMargins, setCompMargins] = useState([20, 30, 40, 50]);

  // Desconto
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [productCost, setProductCost] = useState(0);

  // ===== Cálculos Markup/Margem =====
  const totalPercentCosts = taxes + commission;
  const divisor = 1 - (desiredMargin / 100) - (totalPercentCosts / 100);
  const suggestedPrice = divisor > 0 ? (costPrice + fixedCosts) / divisor : 0;
  const markup = costPrice > 0 ? ((suggestedPrice - costPrice) / costPrice) * 100 : 0;
  const grossProfit = suggestedPrice - costPrice - fixedCosts - (suggestedPrice * totalPercentCosts / 100);
  const effectiveMargin = suggestedPrice > 0 ? (grossProfit / suggestedPrice) * 100 : 0;

  // ===== Ponto de Equilíbrio =====
  const contributionMargin = avgSalePrice - avgVariableCost;
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(monthlyFixedCosts / contributionMargin) : 0;
  const breakEvenRevenue = breakEvenUnits * avgSalePrice;
  const contributionPercent = avgSalePrice > 0 ? (contributionMargin / avgSalePrice) * 100 : 0;

  // ===== Desconto =====
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  const discountProfit = discountedPrice - productCost;
  const discountMargin = discountedPrice > 0 ? (discountProfit / discountedPrice) * 100 : 0;

  return (
    <div className="flex flex-col">
      <AppHeader title="Calculadora de Precificação" />
      <div className="flex-1 space-y-6 p-6">

        <Tabs defaultValue="markup" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="markup"><Calculator className="mr-1 h-4 w-4" /> Markup e Margem</TabsTrigger>
            <TabsTrigger value="breakeven"><Target className="mr-1 h-4 w-4" /> Ponto de Equilíbrio</TabsTrigger>
            <TabsTrigger value="compare"><BarChart3 className="mr-1 h-4 w-4" /> Comparador de Margens</TabsTrigger>
            <TabsTrigger value="discount"><Percent className="mr-1 h-4 w-4" /> Simulador de Desconto</TabsTrigger>
          </TabsList>

          {/* ===== MARKUP E MARGEM ===== */}
          <TabsContent value="markup">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Dados do Produto</CardTitle>
                  <CardDescription>Informe os custos para calcular o preço de venda ideal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Custo do Produto (R$)</Label>
                      <Input type="number" step="0.01" value={costPrice || ""} onChange={(e) => setCostPrice(+e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Margem Desejada (%)</Label>
                      <Input type="number" step="0.1" value={desiredMargin || ""} onChange={(e) => setDesiredMargin(+e.target.value)} placeholder="30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Custos Fixos (R$)</Label>
                      <Input type="number" step="0.01" value={fixedCosts || ""} onChange={(e) => setFixedCosts(+e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Impostos (%)</Label>
                      <Input type="number" step="0.1" value={taxes || ""} onChange={(e) => setTaxes(+e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Comissão (%)</Label>
                      <Input type="number" step="0.1" value={commission || ""} onChange={(e) => setCommission(+e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultCard label="Preço de Venda Sugerido" value={`R$ ${suggestedPrice.toFixed(2)}`} variant="success" sub={`Markup: ${markup.toFixed(1)}%`} />
                  <div className="grid grid-cols-2 gap-3">
                    <ResultCard label="Lucro por Unidade" value={`R$ ${grossProfit.toFixed(2)}`} variant={grossProfit > 0 ? "success" : "destructive"} />
                    <ResultCard label="Margem Efetiva" value={`${effectiveMargin.toFixed(1)}%`} variant={effectiveMargin >= desiredMargin ? "success" : "warning"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ResultCard label="Impostos + Comissão" value={`R$ ${(suggestedPrice * totalPercentCosts / 100).toFixed(2)}`} sub={`${totalPercentCosts.toFixed(1)}% do preço`} />
                    <ResultCard label="Custo Total" value={`R$ ${(costPrice + fixedCosts).toFixed(2)}`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== PONTO DE EQUILÍBRIO ===== */}
          <TabsContent value="breakeven">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Dados Mensais</CardTitle>
                  <CardDescription>Descubra quantas unidades precisam ser vendidas para cobrir os custos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custos Fixos Mensais (R$)</Label>
                    <Input type="number" step="0.01" value={monthlyFixedCosts || ""} onChange={(e) => setMonthlyFixedCosts(+e.target.value)} placeholder="Ex: aluguel, salários..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Médio de Venda (R$)</Label>
                      <Input type="number" step="0.01" value={avgSalePrice || ""} onChange={(e) => setAvgSalePrice(+e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Variável Médio (R$)</Label>
                      <Input type="number" step="0.01" value={avgVariableCost || ""} onChange={(e) => setAvgVariableCost(+e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Resultado</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <ResultCard label="Ponto de Equilíbrio" value={`${breakEvenUnits} unidades/mês`} variant={breakEvenUnits > 0 ? "warning" : "default"} sub={`Faturamento mínimo: R$ ${breakEvenRevenue.toFixed(2)}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <ResultCard label="Margem de Contribuição" value={`R$ ${contributionMargin.toFixed(2)}`} sub="Por unidade vendida" variant={contributionMargin > 0 ? "success" : "destructive"} />
                    <ResultCard label="Margem Contrib. (%)" value={`${contributionPercent.toFixed(1)}%`} variant={contributionPercent > 30 ? "success" : "warning"} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== COMPARADOR ===== */}
          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Comparador de Margens</CardTitle>
                <CardDescription>Compare preços de venda para diferentes margens de lucro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Custo do Produto (R$)</Label>
                  <Input type="number" step="0.01" value={compCost || ""} onChange={(e) => setCompCost(+e.target.value)} placeholder="0.00" className="max-w-xs" />
                </div>
                {compCost > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {compMargins.map((m) => {
                      const price = compCost / (1 - m / 100);
                      const profit = price - compCost;
                      return (
                        <div key={m} className="rounded-lg border p-4 space-y-2">
                          <Badge variant="secondary" className="text-xs">Margem {m}%</Badge>
                          <p className="text-lg font-bold">R$ {price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Lucro: R$ {profit.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Markup: {((price - compCost) / compCost * 100).toFixed(1)}%</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DESCONTO ===== */}
          <TabsContent value="discount">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4" /> Simulador de Desconto</CardTitle>
                  <CardDescription>Verifique o impacto de um desconto na sua margem de lucro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Original (R$)</Label>
                      <Input type="number" step="0.01" value={originalPrice || ""} onChange={(e) => setOriginalPrice(+e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Desconto (%)</Label>
                      <Input type="number" step="0.1" value={discountPercent || ""} onChange={(e) => setDiscountPercent(+e.target.value)} placeholder="10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Custo do Produto (R$)</Label>
                    <Input type="number" step="0.01" value={productCost || ""} onChange={(e) => setProductCost(+e.target.value)} placeholder="0.00" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Resultado do Desconto</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <ResultCard label="Preço com Desconto" value={`R$ ${discountedPrice.toFixed(2)}`} sub={`Desconto de R$ ${(originalPrice - discountedPrice).toFixed(2)}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <ResultCard label="Lucro com Desconto" value={`R$ ${discountProfit.toFixed(2)}`} variant={discountProfit > 0 ? "success" : "destructive"} />
                    <ResultCard label="Margem com Desconto" value={`${discountMargin.toFixed(1)}%`} variant={discountMargin >= 15 ? "success" : discountMargin >= 0 ? "warning" : "destructive"} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
