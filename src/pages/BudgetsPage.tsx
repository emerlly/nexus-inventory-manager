import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { budgetService, customerService, productService, companyService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, FileImage, FileText, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BudgetItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Budget {
  _id: string;
  customer?: any;
  items: { product: any; quantity: number; unitPrice: number; totalPrice: number }[];
  totalValue: number;
  status: "pendente" | "aprovado" | "rejeitado";
  notes?: string;
  validUntil?: string;
  createdAt?: string;
}

const statusColors: Record<string, string> = {
  pendente: "bg-warning/15 text-warning",
  aprovado: "bg-success/15 text-success",
  rejeitado: "bg-destructive/15 text-destructive",
};

export default function BudgetsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);

  const { data = [], isLoading } = useQuery({ queryKey: ["budgets"], queryFn: budgetService.getAll });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });
  const company = useQuery({ queryKey: ["company"], queryFn: companyService.get });

  const save = useMutation({
    mutationFn: (d: any) => editId ? budgetService.update(editId, d) : budgetService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setOpen(false);
      toast({ title: editId ? "Orçamento atualizado!" : "Orçamento criado!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar orçamento" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); toast({ title: "Orçamento excluído!" }); },
  });

  const addItem = () => setItems([...items, { product: "", productName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = value;
    if (field === "product") {
      const p = products.data?.find((p: any) => p._id === value);
      if (p) { newItems[i].unitPrice = p.salePrice; newItems[i].productName = p.name; }
    }
    setItems(newItems);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast({ variant: "destructive", title: "Adicione ao menos um item" }); return; }
    save.mutate({
      customer: customer || undefined,
      items: items.map((i) => ({ product: i.product, quantity: i.quantity, unitPrice: i.unitPrice })),
      notes: notes || undefined,
      validUntil: validUntil || undefined,
    });
  };

  const openNew = () => {
    setEditId(null); setCustomer(""); setItems([]); setNotes(""); setValidUntil(""); setOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditId(b._id);
    setCustomer(typeof b.customer === "object" ? b.customer?._id : b.customer || "");
    setNotes(b.notes || "");
    setValidUntil(b.validUntil ? b.validUntil.slice(0, 10) : "");
    setItems((b.items || []).map((it) => ({
      product: typeof it.product === "object" ? it.product?._id : it.product,
      productName: typeof it.product === "object" ? it.product?.name : "",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })));
    setOpen(true);
  };

  const exportPNG = useCallback(async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: null });
    const link = document.createElement("a");
    link.download = `orcamento-${viewBudget?._id?.slice(-8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "PNG exportado!" });
  }, [viewBudget, toast]);

  const exportPDF = useCallback(async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: null });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`orcamento-${viewBudget?._id?.slice(-8)}.pdf`);
    toast({ title: "PDF exportado!" });
  }, [viewBudget, toast]);

  return (
    <div className="flex flex-col">
      <AppHeader title="Orçamentos" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "createdAt", label: "Data", render: (b) => b.createdAt ? new Date(b.createdAt).toLocaleDateString("pt-BR") : "—" },
            { key: "customer", label: "Cliente", render: (b) => typeof b.customer === "object" ? b.customer?.name : "—" },
            { key: "items", label: "Itens", render: (b) => b.items?.length ?? 0 },
            { key: "Description", label: "Descrição", render: (b) => b.notes ? b.notes.slice(0, 55) + (b.notes.length > 50 ? "..." : "") : "—" }, 
            { key: "totalValue", label: "Total", render: (b) => `R$ ${b.totalValue?.toFixed(2)}` },
            { key: "status", label: "Status", render: (b) => <Badge className={statusColors[b.status] || ""}>{b.status}</Badge> },
            {
              key: "_actions", label: "", render: (b) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewBudget(b)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                </div>
              ),
            },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          onDelete={(b: any) => remove.mutate(b._id)}
          addLabel="Novo Orçamento"
        />
      </div>

      {/* View / Export Dialog */}
      <Dialog open={!!viewBudget} onOpenChange={() => setViewBudget(null)} >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <span>Orçamento</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportPNG}><FileImage className="mr-1 h-4 w-4" /> PNG</Button>
                <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="mr-1 h-4 w-4" /> PDF</Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewBudget && (
            <div ref={printRef} className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{company.data?.name || "NexusSystems"}</h2>
                  {company.data?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {company.data.cnpj}</p>}
                  {company.data?.phone && <p className="text-xs text-muted-foreground">Tel: {company.data.phone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">ORÇAMENTO</p>
                  <p className="text-xs text-muted-foreground">#{viewBudget._id?.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">{viewBudget.createdAt ? new Date(viewBudget.createdAt).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{typeof viewBudget.customer === "object" ? viewBudget.customer?.name : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Validade</p>
                  <p className="font-medium">{viewBudget.validUntil ? new Date(viewBudget.validUntil).toLocaleDateString("pt-BR") : "—"}</p>
                </div>
              </div>

              {/* Items table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">Produto</th>
                    <th className="py-2 font-medium text-center">Qtd</th>
                    <th className="py-2 font-medium text-right">Preço Unit.</th>
                    <th className="py-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewBudget.items || []).map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{typeof item.product === "object" ? item.product?.name : item.product}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">R$ {item.unitPrice?.toFixed(2)}</td>
                      <td className="py-2 text-right">R$ {item.totalPrice?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg font-bold">Total: R$ {viewBudget.totalValue?.toFixed(2)}</p>
                </div>
              </div>

              {viewBudget.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{viewBudget.notes}</p>
                  </div>
                </>
              )}

              <p className="text-center text-xs text-muted-foreground mt-4">
                © {new Date().getFullYear()} {company.data?.name || "NexusSystems"} — Todos os direitos reservados.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {(customers.data || []).map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições, prazo de entrega..." />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
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
                        {(products.data || []).map((p: any) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
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
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar Orçamento"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
