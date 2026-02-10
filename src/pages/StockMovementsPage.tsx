import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { stockMovementService, productService } from "@/services";
import type { StockMovement, StockMovementFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function StockMovementsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StockMovementFormData>({ product: "", type: "entry", quantity: 1 });

  const { data = [], isLoading } = useQuery({ queryKey: ["stockMovements"], queryFn: stockMovementService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });

  const create = useMutation({
    mutationFn: (d: StockMovementFormData) => stockMovementService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockMovements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      toast({ title: "Movimentação registrada!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao registrar" }),
  });

  const openNew = () => { setForm({ product: "", type: "entry", quantity: 1, reason: "" }); setOpen(true); };

  return (
    <div className="flex flex-col">
      <AppHeader title="Movimentações de Estoque" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "createdAt", label: "Data", render: (m) => m.createdAt ? new Date(m.createdAt).toLocaleDateString("pt-BR") : "—" },
            { key: "product", label: "Produto", render: (m) => typeof m.product === "object" ? m.product?.name : "—" },
            { key: "type", label: "Tipo", render: (m) => (
              <Badge className={m.type === "entry" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                {m.type === "entry" ? "Entrada" : "Saída"}
              </Badge>
            )},
            { key: "quantity", label: "Quantidade" },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          addLabel="Nova Movimentação"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {(products.data || []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v: "entry" | "exit") => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Salvando..." : "Registrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
