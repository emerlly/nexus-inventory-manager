import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { companyService } from "@/services";
import type { Company } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanySettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Company>({ queryKey: ["company"], queryFn: companyService.get });

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.companyName || "",
        cnpj: data.document || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        logo: data.logo || "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => companyService.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      toast({ title: "Dados da empresa salvos!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Configurações da Empresa" />
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-4 max-w-2xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>URL do Logo</Label>
                  <Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." />
                  {form.logo && (
                    <div className="mt-2">
                      <img src={form.logo} alt="Logo" className="h-16 w-16 rounded-lg object-contain border" />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={save.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {save.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
