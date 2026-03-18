import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { companyService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Link, Key, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function IntegrationSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["company"], queryFn: companyService.get });

  const [form, setForm] = useState({
    paymentLink: "",
    paymentToken: "",
    webhookUrl: "",
    apiKey: "",
  });

  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        paymentLink: data.paymentLink || "",
        paymentToken: data.paymentToken || "",
        webhookUrl: data.webhookUrl || "",
        apiKey: data.apiKey || "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => companyService.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Configurações de Integração" />
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-4 max-w-2xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-2xl space-y-6">
            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Pagamentos
                </CardTitle>
                <CardDescription>
                  Configure os dados de integração com o gateway de pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Link de Pagamento</Label>
                  <Input
                    value={form.paymentLink}
                    onChange={(e) => setForm({ ...form, paymentLink: e.target.value })}
                    placeholder="https://pagamento.exemplo.com/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL base para redirecionamento de pagamentos online.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Token de Pagamento</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={form.paymentToken}
                      onChange={(e) => setForm({ ...form, paymentToken: e.target.value })}
                      placeholder="sk_live_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Token secreto do gateway de pagamento.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* API Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API & Webhooks
                </CardTitle>
                <CardDescription>
                  Configure chaves de API e endpoints de webhook.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                    placeholder="https://api.exemplo.com/webhook"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL para receber notificações automáticas de eventos.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Chave de API</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      placeholder="api_key_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chave de autenticação para integrações externas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {save.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
