import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { productService, categoryService, supplierService } from "@/services";
import type { Product, ProductFormData, ProductAttribute } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

function StockBadge({ quantity, minStock }: { quantity: number; minStock?: number }) {
  const min = minStock ?? 10;
  if (quantity <= 0) return <Badge variant="destructive">Sem estoque</Badge>;
  if (quantity <= min) return <Badge className="bg-yellow-500 text-white">Baixo ({quantity})</Badge>;
  return <Badge className="bg-green-600 text-white">{quantity}</Badge>;
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [form, setForm] = useState<ProductFormData>({
    name: "",
    description: "",
    salePrice: 0,
    costPrice: 0,
    stock: { physical: 0 },
    minStock: 10,
    categoryId: "",
    supplierId: "",
    attributes: [],
  });
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

  //  IMPORTANTE: envolver em função para passar o filtro
  const {
    data: products = [],
    isLoading,
  } = useQuery({
    queryKey: ["products", showLowStock],
    queryFn: () => showLowStock ? productService.getLowStock() : productService.getAll(),
  });

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryService.getAll });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: supplierService.getAll });

  const save = useMutation({
    mutationFn: (d: ProductFormData) => editing ? productService.update(editing._id, d) : productService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); toast({ title: "Salvo com sucesso!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (p: Product) => productService.remove(p._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: "Excluído!" }); },
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      salePrice: 0,
      costPrice: 0,
      stock: { physical: 0 },
      minStock: 10,
      categoryId: "",
      supplierId: "",
      attributes: [],
    });
    setAttributes([]);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const attrs = p.attributes || [];
    setForm({
      name: p.name, description: p.description || "", salePrice: p.salePrice, costPrice: p.costPrice,
      stock: { physical: p.stock?.physical ?? 0 },
      minStock: p.minStock || 10,
      categoryId: typeof p.category === "object" ? p.category?._id : p.category,
      supplierId: typeof p.supplier === "object" ? p.supplier?._id : p.supplier,
      attributes: attrs,
    });
    setAttributes(attrs);
    setOpen(true);
  };

  const selectedCategory = categories.data?.find(
    (c) => c._id === form.categoryId
  );

  const skuPreview = selectedCategory
    ? `${selectedCategory.prefix}-XXXX`
    : "Selecione uma categoria";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // validação simples extra (opcional)
    if (!form.categoryId || !form.supplierId) {
      toast({
        variant: "destructive",
        title: "Preencha todos os campos obrigatórios",
      });
      return;
    }

    // abre o modal de confirmação
    setConfirmOpen(true);
  };
  return (
    <div className="flex flex-col">
      <AppHeader title="Produtos" />
      <div className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <Button variant={showLowStock ? "destructive" : "outline"} onClick={() => setShowLowStock((prev) => !prev)}>
            {showLowStock ? "Mostrar Todos" : "Somente Estoque Baixo"}
          </Button>
        </div>

        <DataTable
          columns={[
            { key: "SKU", label: "SKU", render: (p) => p.SKU || "—", },
            { key: "name", label: "Nome" },
            { key: "description", label: "Descrição", render: (p) => p.description || "—", },
            { key: "price", label: "Preço", render: (p) => `R$ ${p.salePrice?.toFixed(2)}`, },
            { key: "category", label: "Categoria", render: (p) => typeof p.category === "object" ? p.category?.name : p.category, },
            { key: "quantity", label: "Estoque", render: (p) => (<StockBadge quantity={p.stock?.physical ?? 0} minStock={p.minStock} />) },
            { key: "supplier", label: "Fornecedor", render: (p) => typeof p.supplier === "object" ? p.supplier?.name : p.supplier, },
          ]}
          data={products}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({
                ...form,
                name: e.target.value,
              })
              }
                required />
              </div>

              <div>
                <Label>SKU</Label> <Input value={form.categoryId
                  ? `${skuPreview}` : "Será gerado automaticamente"
                } disabled />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({
                ...form,
                description: e.target.value,
              })
              } />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço Venda</Label>
                <Input type="number" step="0.01" value={form.salePrice || ""} onChange={(e) => setForm({
                  ...form,
                  salePrice: +e.target.value,
                })
                }
                  required />
              </div>

              <div>
                <Label>Preço Custo</Label>
                <Input type="number" step="0.01" value={form.costPrice || ""} onChange={(e) => setForm({
                  ...form,
                  costPrice: +e.target.value,
                })
                } />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={form.stock.physical || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: {
                        ...form.stock,
                        physical: +e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={form.minStock || ""} onChange={(e) => setForm({
                  ...form,
                  minStock: +e.target.value,
                })
                } />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{(categories.data || []).map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{(suppliers.data || []).map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Atributos Personalizados */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Atributos Personalizados</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAttributes([...attributes, { k: "", v: "" }])}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar Atributo
                </Button>
              </div>
              {attributes.map((attr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome (ex: Cor)"
                    value={attr.k}
                    onChange={(e) => {
                      const newAttrs = [...attributes];
                      newAttrs[i] = { ...newAttrs[i], k: e.target.value };
                      setAttributes(newAttrs);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valor (ex: Azul)"
                    value={attr.v}
                    onChange={(e) => {
                      const newAttrs = [...attributes];
                      newAttrs[i] = { ...newAttrs[i], v: e.target.value };
                      setAttributes(newAttrs);
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setAttributes(attributes.filter((_, idx) => idx !== i))} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {attributes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum atributo adicionado.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!form.categoryId || !form.supplierId}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => { setConfirmOpen(false); save.mutate({ ...form, attributes: attributes.filter(a => a.k && a.v) }); }}
        title={editing ? "Confirmar edição" : "Confirmar cadastro"}
        description={editing ? "Deseja salvar as alterações deste produto?" : "Deseja cadastrar este novo produto?"}
        isPending={save.isPending}
      />
    </div>
  );
}
