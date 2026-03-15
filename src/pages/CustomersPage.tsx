import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { customerService } from "@/services";
import api from "@/services/api";
import type { Customer, CustomerFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";
import { Loader2 } from "lucide-react";

const emptyForm: CustomerFormData = {
  name: "", email: "", phone: "", address: "", cpf: "", cep: "", cidade: "", rua: "",
};

export default function CustomersPage() {

  const qc = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAll,
  });

  const save = useMutation({
    mutationFn: (d: CustomerFormData) =>
      editing ? customerService.update(editing._id, d) : customerService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      toast({ title: "Salvo!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (c: Customer) => customerService.remove(c._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Excluído!" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      cpf: c.cpf,
      cep: c.cep,
      cidade: c.cidade,
      rua: c.rua,
    });
    setOpen(true);
  };

  const handleCepChange = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, cep: cleanCep, cidade: "", rua: "" }));

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const { data } = await api.get(`/cep/${cleanCep}`);
        setForm((prev) => ({
          ...prev,
          cidade: data.cidade || data.localidade || "",
          rua: data.rua || data.logradouro || "",
        }));
      } catch {
        toast({ variant: "destructive", title: "CEP não encontrado" });
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  return (

    <div className="flex flex-col">

      <AppHeader title="Clientes" />

      <div className="flex-1 p-6">

        <DataTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "email", label: "E-mail" },
            { key: "phone", label: "Telefone" },
            { key: "cpf", label: "CPF" },
            { key: "cidade", label: "Cidade" },
            {
              key: "active",
              label: "Situação",
              render: (c: Customer) =>
                c.active ? (
                  <span className="text-green-600">Ativo</span>
                ) : (
                  <span className="text-red-600">Inativo</span>
                ),
            },
          ]}

          data={data}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(c) => del.mutate(c)}
          addLabel="Novo Cliente"
        />

      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf || ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="relative">
                  <Input
                    value={form.cep || ""}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000000"
                    maxLength={9}
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade || ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rua</Label>
              <Input value={form.rua || ""} onChange={(e) => setForm({ ...form, rua: e.target.value })} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Endereço (complemento)</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Nº, bloco, apto..." />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={form.document}
                onChange={(e) =>
                  setForm({ ...form, document: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={form.cep}
                onChange={(e) =>
                  setForm({ ...form, cep: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">

              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>

            </div>

          </form>

        </DialogContent>

      </Dialog>

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          save.mutate(form);
        }}
        title={editing ? "Confirmar edição" : "Confirmar cadastro"}
        description={
          editing
            ? "Deseja salvar as alterações deste cliente?"
            : "Deseja cadastrar este novo cliente?"
        }
        isPending={save.isPending}
      />

    </div>

  );
}