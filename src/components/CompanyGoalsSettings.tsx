import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
  monthlyGoal?: number;
  annualGoal?: number;
  breakEvenPoint?: number;
}

interface CompanyGoalsSettingsProps {
  className?: string;
}

export function CompanyGoalsSettings({ className }: CompanyGoalsSettingsProps) {
  const queryClient = useQueryClient();

  const [monthlyGoal, setMonthlyGoal] = useState<string>("");
  const [annualGoal, setAnnualGoal] = useState<string>("");
  const [breakEvenPoint, setBreakEvenPoint] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["company"],
    queryFn: companyService.get,
    onSuccess: (data) => {
      setMonthlyGoal(String(data.monthlyGoal ?? 0));
      setAnnualGoal(String(data.annualGoal ?? 0));
      setBreakEvenPoint(String(data.breakEvenPoint ?? 0));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Company>) => companyService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "salesProjections"] });
      toast.success("Metas atualizadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar metas: ${error?.message || "Erro desconhecido"}`);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        monthlyGoal: parseFloat(monthlyGoal) || 0,
        annualGoal: parseFloat(annualGoal) || 0,
        breakEvenPoint: parseFloat(breakEvenPoint) || 0,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Configurar Metas de Vendas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monthlyGoal">Meta Mensal (R$)</Label>
          <Input
            id="monthlyGoal"
            type="number"
            placeholder="0.00"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Define a meta de vendas para cada mês
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualGoal">Meta Anual (R$)</Label>
          <Input
            id="annualGoal"
            type="number"
            placeholder="0.00"
            value={annualGoal}
            onChange={(e) => setAnnualGoal(e.target.value)}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Define a meta de vendas para o ano inteiro
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breakEvenPoint">Ponto de Equilíbrio (R$)</Label>
          <Input
            id="breakEvenPoint"
            type="number"
            placeholder="0.00"
            value={breakEvenPoint}
            onChange={(e) => setBreakEvenPoint(e.target.value)}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Valor mínimo de vendas necessário para cobrir custos fixos
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || updateMutation.isPending}
          className="w-full"
        >
          {isSaving || updateMutation.isPending ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Salvar Metas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}