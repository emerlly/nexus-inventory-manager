import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { customerService } from "@/services";
import type { Customer, CustomerFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

export default function CustomersPage() {

  const qc = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    documentType: "CPF",
    document: "",
    address: {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      complement: ""
    }
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getAll()
  });

  const save = useMutation({
    mutationFn: (d: CustomerFormData) =>
      editing
        ? customerService.update(editing._id, d)
        : customerService.create(d),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      toast({ title: "Salvo!" });
    },

    onError: () =>
      toast({ variant: "destructive", title: "Erro ao salvar" })
  });

  const del = useMutation({
    mutationFn: (c: Customer) => customerService.remove(c._id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Excluído!" });
    }
  });

  const openNew = () => {

    setEditing(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      documentType: "CPF",
      document: "",
      address: [] as any
    });

    setOpen(true);
  };

  const openEdit = (c: Customer) => {

    setEditing(c);

    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      documentType: c.documentType || "CPF",
      document: c.document || "",
      address: {
        cep: c.address?.cep || "",
        street: c.address?.street || "",
        number: c.address?.number || "",
        neighborhood: c.address?.neighborhood || "",
        city: c.address?.city || "",
        state: c.address?.state || "",
        complement: c.address?.complement || ""
      }
    });

    setOpen(true);
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
            { key: "address", label: "Endereço" },
            { key: "cpf", label: "CPF" },

            {
              key: "active",
              label: "Situação",
              render: (c: Customer) =>
                c.active
                  ? <span className="text-green-600">Ativo</span>
                  : <span className="text-red-600">Inativo</span>
            }
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

        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
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
                value={form.address.cep}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, cep: e.target.value } })
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