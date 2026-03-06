import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { budgetService, customerService, productService, companyService, saleService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, FileImage, FileText, Pencil, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

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
  rascunho: "bg-muted text-muted-foreground",
  pendente: "bg-warning/15 text-warning",
  aprovado: "bg-success/15 text-success",
  rejeitado: "bg-destructive/15 text-destructive",
  convertido: "bg-primary/15 text-primary",
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
  const sendToApproval = useMutation({
    mutationFn: (id: string) =>
      budgetService.approve(id, { status: "aprovado" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Orçamento enviado para aprovação!" });
    },
    onError: () =>
      toast({ variant: "destructive", title: "Erro ao enviar para aprovação" }),
  });
  const approveBudget = useMutation({
    mutationFn: async (b: Budget) => {
      await saleService.create({
        customer: typeof b.customer === "object" ? b.customer?._id : b.customer,
        items: (b.items || []).map((it) => ({
          product: typeof it.product === "object" ? it.product?._id : it.product,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      });

      await budgetService.update(b._id, {
        status: "convertido",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast({ title: "Orçamento convertido em venda!" });
      setApproveTarget(null);
    },
    onError: () =>
      toast({ variant: "destructive", title: "Erro ao converter orçamento" }),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Budget | null>(null);

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
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    setConfirmOpen(false);

    save.mutate({
      customer: customer || undefined,
      items: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      notes: notes || undefined,
      validUntil: validUntil || undefined,
      status: "rascunho", // 
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
              key: "_actions",
              label: "",
              render: (b) => (
                <div className="flex gap-1">
                  <Button variant="ghost"  size="icon" onClick={() => setViewBudget(b)} title="Visualizar" >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {b.status === "rascunho" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)} title="Editar" >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => sendToApproval.mutate(b._id)} title="Aprovar Orçamento" className="text-blue-600 hover:text-blue-700" >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {b.status === "pendente" && (
                    <Button variant="ghost" size="icon" onClick={() => setApproveTarget(b)} title="Aprovar e converter em venda" className="text-green-600 hover:text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}

                  {b.status !== "convertido" && (
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(b._id)} title="Excluir" className="text-destructive" >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ),
            }
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
            <div ref={printRef} className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-background text-foreground">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{company.data?.name || "NexusSystems"}</h2>
                  {company.data?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {company.data.cnpj}</p>}
                  {company.data?.phone && <p className="text-xs text-muted-foreground">Tel: {company.data.phone}</p>}
                  {company.data?.email && <p className="text-xs text-muted-foreground">Email: {company.data.email}</p>}
                  {company.data?.address && <p className="text-xs text-muted-foreground">{company.data.address}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">ORÇAMENTO</p>
                  <p className="text-xs text-muted-foreground">Nº #{viewBudget._id?.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    Emissão: {viewBudget.createdAt ? new Date(viewBudget.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{typeof viewBudget.customer === "object" ? viewBudget.customer?.name : "—"}</p>
                  {typeof viewBudget.customer === "object" && viewBudget.customer?.email && (
                    <p className="text-xs text-muted-foreground">{viewBudget.customer.email}</p>
                  )}
                  {typeof viewBudget.customer === "object" && viewBudget.customer?.phone && (
                    <p className="text-xs text-muted-foreground">Tel: {viewBudget.customer.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Validade</p>
                  <p className="font-medium text-foreground">
                    {viewBudget.validUntil
                      ? new Date(viewBudget.validUntil).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Items table */}
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 font-semibold text-foreground">#</th>
                    <th className="py-2 font-semibold text-foreground">Produto</th>
                    <th className="py-2 font-semibold text-center text-foreground">Qtd</th>
                    <th className="py-2 font-semibold text-right text-foreground">Preço Unit.</th>
                    <th className="py-2 font-semibold text-right text-foreground">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewBudget.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 text-foreground">{typeof item.product === "object" ? item.product?.name : item.product}</td>
                      <td className="py-2 text-center text-foreground">{item.quantity}</td>
                      <td className="py-2 text-right text-foreground">R$ {item.unitPrice?.toFixed(2)}</td>
                      <td className="py-2 text-right font-medium text-foreground">R$ {item.totalPrice?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-4">
                <div className="text-right border-t-2 border-primary pt-2 px-4">
                  <p className="text-xs text-muted-foreground">Total do Orçamento</p>
                  <p className="text-xl font-bold text-foreground">R$ {viewBudget.totalValue?.toFixed(2)}</p>
                </div>
              </div>

              {viewBudget.notes && (
                <>
                  <Separator className="my-3" />
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Observações / Condições</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{viewBudget.notes}</p>
                  </div>
                </>
              )}

              {/* Validity notice */}
              <div className="rounded-md border border-border bg-muted/30 p-3 mb-6 text-center">
                <p className="text-xs text-muted-foreground">
                  {viewBudget.validUntil
                    ? `Este orçamento é válido até ${new Date(viewBudget.validUntil).toLocaleDateString("pt-BR")}.`
                    : "Validade não informada. Consulte o emitente."}
                  {" "}Valores sujeitos a alteração sem aviso prévio após o vencimento.
                </p>
              </div>

              {/* Signature area */}
              <div className="grid grid-cols-2 gap-8 mt-8 mb-4">
                <div className="text-center">
                  <div className="border-t border-foreground/30 pt-2 mx-4">
                    <p className="text-xs text-muted-foreground">{company.data?.name || "NexusSystems"}</p>
                    <p className="text-[10px] text-muted-foreground">Emitente</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-foreground/30 pt-2 mx-4">
                    <p className="text-xs text-muted-foreground">
                      {typeof viewBudget.customer === "object" ? viewBudget.customer?.name : "Cliente"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Assinatura do Cliente</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground mt-6">
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

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmSave}
        title={editId ? "Confirmar edição" : "Confirmar cadastro"}
        description={editId ? "Deseja salvar as alterações deste orçamento?" : "Deseja cadastrar este novo orçamento?"}
        isPending={save.isPending}
      />

      <ConfirmSaveDialog
        open={!!approveTarget}
        onOpenChange={() => setApproveTarget(null)}
        onConfirm={() => approveTarget && approveBudget.mutate(approveTarget)}
        title="Aprovar orçamento"
        description={`Deseja aprovar este orçamento de R$ ${approveTarget?.totalValue?.toFixed(2) || "0.00"} e convertê-lo em uma venda? O estoque será atualizado automaticamente.`}
        confirmLabel="Aprovar e Vender"
        isPending={approveBudget.isPending}
      />
    </div>
  );
}
