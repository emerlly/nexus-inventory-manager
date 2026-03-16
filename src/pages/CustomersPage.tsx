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
import InputMask from "react-input-mask";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { useApiError } from "@/hooks/useApiError";
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/utils"

const emptyForm: CustomerFormData = {
  active: true,
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
};

export default function CustomersPage() {

  const { handleError } = useApiError();
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

  function mapCustomerToApi(form: CustomerFormData) {
    return {
      active: form.active,
      name: form.name,
      email: form.email,
      phone: form.phone,
      documentType: form.documentType,
      document: form.document,

      address: {
        cep: form.address.cep,
        street: form.address.street,
        city: form.address.city,
        state: form.address.state,
        complement: form.address.complement
      }
    };
  }

  const save = useMutation({
    mutationFn: (d: CustomerFormData) => {
      const payload = mapCustomerToApi(d);

      return editing
        ? customerService.update(editing._id, payload)
        : customerService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["update"] });
      setOpen(false);
      toast({ title: "Salvo!" });
    },
    onError: (error: AxiosError) => {
      handleError(error);
    },
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
      active: c.active,
      name: c.name,
      email: c.email,
      phone: c.phone,
      document: c.document,
      documentType: c.documentType as "CPF" | "CNPJ",
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

  const handleCepChange = async (cep: string) => {

    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        cep
      }
    }));

    const cleaned = cep.replace(/\D/g, "");

    if (cleaned.length !== 8) return;

    try {
      setCepLoading(true);

      const { data } = await api.get(`/cep/${cleaned}`);

      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          cep: data.cep || prev.address.cep,
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          neighborhood: data.neighborhood || ""
        }
      }));

    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setCepLoading(false);
    }
  };;

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

            {
              key: "phone",
              label: "Telefone",
              render: (c: Customer) => formatPhone(c.phone)
            },

            {
              key: "document",
              label: "CPF/CNPJ",
              render: (c: Customer) =>
                c.documentType === "CPF"
                  ? formatCPF(c.document)
                  : formatCNPJ(c.document)
            },

            {
              key: "city",
              label: "Cidade",
              render: (c: Customer) => c.address?.city
            },

            {
              key: "state",
              label: "Estado",
              render: (c: Customer) => c.address?.state
            },

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

          <form onSubmit={handleSubmit} className="space-y-3 p-2">

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Tipo de cliente + documento */}
            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      documentType: e.target.value as "CPF" | "CNPJ",
                      document: ""
                    })
                  }
                >
                  <option value="CPF">Pessoa Física</option>
                  <option value="CNPJ">Pessoa Jurídica</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{form.documentType}</Label>
                <InputMask
                  mask={
                    form.documentType === "CPF"
                      ? "999.999.999-99"
                      : "99.999.999/9999-99"
                  }
                  value={form.document || ""}
                  onChange={(e) =>
                    setForm({ ...form, document: e.target.value })
                  }
                >
                  {(inputProps: any) => <Input {...inputProps} placeholder={
                    form.documentType === "CPF"
                      ? "000.000.000-00"
                      : "00.000.000/0000-00"
                  } />}
                </InputMask>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Telefone</Label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={form.phone || ""}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} placeholder="(00) 00000-0000" />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

            </div>

            {/* CEP + Rua */}
            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>CEP</Label>

                <div className="relative">
                  <InputMask
                    mask="99999-999"
                    value={form.address.cep || ""}
                    onChange={(e) => handleCepChange(e.target.value)}
                  >
                    {(inputProps: any) => (
                      <Input {...inputProps} placeholder="00000-000" />
                    )}
                  </InputMask>

                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

              </div>

              <div className="space-y-2">
                <Label>Rua</Label>
                <Input
                  value={form.address.street || ""}
                  readOnly
                  className="bg-muted"
                />
              </div>

            </div>

            {/* Complemento + Cidade + Estado */}
            <div className="grid grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={form.address.complement || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: {
                        ...form.address,
                        complement: e.target.value
                      }
                    })
                  }
                  placeholder="Nº, bloco, apto..."
                />
              </div>

              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={form.address.city || ""}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={form.address.state || ""}
                  readOnly
                  className="bg-muted"
                />
              </div>

            </div>

            <div className="flex justify-between items-end gap-4">

              <div className="space-y-2">
                <Label>Situação</Label>

                <select
                  className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm 
      ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={form.active ? "ativo" : "inativo"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: e.target.value === "ativo"
                    })
                  }
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

              </div>

              <div className="flex gap-2">
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