import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { categoryService } from "@/services";
import type { Category, CategoryFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>({ name: "", description: "" });

  const { data = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: categoryService.getAll });

  const save = useMutation({
    mutationFn: (d: CategoryFormData) => editing ? categoryService.update(editing._id, d) : categoryService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setOpen(false); toast({ title: "Salvo!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (c: Category) => categoryService.remove(c._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Excluído!" }); },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "" }); setOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description }); setOpen(true); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Categorias" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "description", label: "Descrição" },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(c) => del.mutate(c)}
          addLabel="Nova Categoria"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
