import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { supplierService } from "@/services";
import type { Supplier, SupplierFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SuppliersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormData>({ name: "" });

  const { data = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: supplierService.getAll });

  const save = useMutation({
    mutationFn: (d: SupplierFormData) => editing ? supplierService.update(editing._id, d) : supplierService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setOpen(false); toast({ title: "Salvo!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (s: Supplier) => supplierService.remove(s._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: "Excluído!" }); },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", phone: "", address: "" }); setOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, email: s.email, phone: s.phone, address: s.address }); setOpen(true); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Fornecedores" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "email", label: "E-mail" },
            { key: "phone", label: "Telefone" },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(s) => del.mutate(s)}
          addLabel="Novo Fornecedor"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
