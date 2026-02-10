import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { productService, categoryService, supplierService } from "@/services";
import type { Product, ProductFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

function StockBadge({ quantity, minStock }: { quantity: number; minStock?: number }) {
  const min = minStock ?? 10;
  if (quantity <= 0) return <Badge variant="destructive">Sem estoque</Badge>;
  if (quantity <= min) return <Badge className="bg-warning text-warning-foreground">Baixo ({quantity})</Badge>;
  return <Badge className="bg-success text-success-foreground">{quantity}</Badge>;
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>({ name: "", price: 0, quantity: 0 });

  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: productService.getAll });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryService.getAll });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: supplierService.getAll });

  const save = useMutation({
    mutationFn: (d: ProductFormData) => editing ? productService.update(editing._id, d) : productService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); toast({ title: "Salvo!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (p: Product) => productService.remove(p._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: "Excluído!" }); },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", price: 0, costPrice: 0, quantity: 0, minStock: 10 }); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: p.price, costPrice: p.costPrice,
      quantity: p.quantity, minStock: p.minStock,
      category: typeof p.category === "object" ? p.category?._id : p.category,
      supplier: typeof p.supplier === "object" ? p.supplier?._id : p.supplier,
    });
    setOpen(true);
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="Produtos" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "price", label: "Preço", render: (p) => `R$ ${p.price?.toFixed(2)}` },
            { key: "category", label: "Categoria", render: (p) => typeof p.category === "object" ? p.category?.name : "—" },
            { key: "quantity", label: "Estoque", render: (p) => <StockBadge quantity={p.quantity} minStock={p.minStock} /> },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(p) => del.mutate(p)}
          addLabel="Novo Produto"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Preço Venda</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} required /></div>
              <div className="space-y-2"><Label>Preço Custo</Label><Input type="number" step="0.01" value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {(categories.data || []).map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={form.supplier || ""} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {(suppliers.data || []).map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
