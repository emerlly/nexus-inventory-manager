import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { saleService, customerService, productService } from "@/services";
import type { Sale, SaleFormData, Product } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaleLineItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function SalesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<SaleLineItem[]>([]);

  const { data = [], isLoading } = useQuery({ queryKey: ["sales"], queryFn: saleService.getAll });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });

  const create = useMutation({
    mutationFn: (d: SaleFormData) => saleService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      toast({ title: "Venda registrada!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao registrar venda" }),
  });

  const addItem = () => setItems([...items, { product: "", productName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = value;
    if (field === "product") {
      const p = products.data?.find((p) => p._id === value);
      if (p) { newItems[i].unitPrice = p.salePrice; newItems[i].productName = p.name; }
    }
    setItems(newItems);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast({ variant: "destructive", title: "Adicione ao menos um produto" }); return; }
    create.mutate({
      customer: customer || undefined,
      items: items.map((i) => ({ product: i.product, quantity: i.quantity, unitPrice: i.unitPrice })),
    });
  };

  const openNew = () => { setCustomer(""); setItems([]); setOpen(true); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Vendas" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "createdAt", label: "Data", render: (s) => s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—" },
            { key: "customer", label: "Cliente", render: (s) => typeof s.customer === "object" ? s.customer?.name : "—" },
            { key: "items", label: "Itens", render: (s) => s.items?.length ?? 0 },
            { key: "total", label: "Total", render: (s) => `R$ ${s.totalValue?.toFixed(2)}` },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          addLabel="Nova Venda"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente (opcional)" /></SelectTrigger>
                <SelectContent>
                  {(customers.data || []).map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Produtos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-2 rounded-md border p-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Produto</Label>
                    <Select value={item.product} onValueChange={(v) => updateItem(i, "product", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {(products.data || []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name} (est: {p.stockQuantity})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", +e.target.value)} />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Preço Unit.</Label>
                    <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", +e.target.value)} />
                  </div>
                  <div className="w-24 text-right font-medium text-sm pb-2">
                    R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-bold">Total: R$ {total.toFixed(2)}</span>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Registrando..." : "Finalizar Venda"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
