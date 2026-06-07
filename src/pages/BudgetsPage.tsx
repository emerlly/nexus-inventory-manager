import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { budgetService, customerService, productService, companyService, saleService, orderService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, FileImage, FileText, Pencil, CheckCircle2, Send, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

interface BudgetItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface Budget {
  _id: string;
  customer?: any;
  items: { product: any; quantity: number; unitPrice: number; totalPrice: number }[];
  totalValue: number;
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Convertido" | "Rascunho";
  notes?: string;
  validUntil?: string;
  createdAt?: string;
}

type ConvertSaleResponse = {
  _id?: string;
  order?: { _id?: string };
  sale?: { _id?: string };
  orderId?: string;
  saleId?: string;
};

const statusColors: Record<string, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Pendente: "bg-warning/15 text-warning",
  Aprovado: "bg-success/15 text-success",
  Rejeitado: "bg-destructive/15 text-destructive",
  Convertido: "bg-primary/15 text-primary",
};

export default function BudgetsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);
  const [paymentCondition, setPaymentCondition] = useState<"avista" | "prazo">("avista");
  const [dueDate, setDueDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Budget | null>(null);
  const [convertTarget, setConvertTarget] = useState<Budget | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const { data = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => budgetService.getAll() as Promise<Budget[]>,
  });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });
  const company = useQuery({ queryKey: ["company"], queryFn: companyService.get });

  const PAYMENT_METHODS = [
    { value: "Dinheiro", label: "Dinheiro" },
    { value: "Pix", label: "Pix" },
    { value: "Credito", label: "Cartao de Credito" },
    { value: "Debito", label: "Cartao de Debito" },
    { value: "Boleto", label: "Boleto" },
  ];

  const syncBudgetInCache = useCallback((budgetId: string, changes: Partial<Budget>) => {
    qc.setQueryData<Budget[]>(["budgets"], (current = []) =>
      current.map((budget) => (
        budget._id === budgetId
          ? { ...budget, ...changes }
          : budget
      )),
    );
  }, [qc]);

  const refreshBudgets = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["budgets"] });
    await qc.refetchQueries({ queryKey: ["budgets"], type: "active" });
  }, [qc]);

  const save = useMutation({
    mutationFn: (payload: any) => editId ? budgetService.update(editId, payload) : budgetService.create(payload),
    onSuccess: async () => {
      await refreshBudgets();
      setOpen(false);
      toast({ title: editId ? "Orçamento atualizado!" : "Orçamento criado!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar orçamento" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: async () => {
      await refreshBudgets();
      toast({ title: "Orçamento excluído!" });
      setViewBudget(null);
    },
  });

  const sendBudget = useMutation({
    mutationFn: (id: string) => budgetService.update(id, { status: "Pendente" }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["budgets"] });
      syncBudgetInCache(id, { status: "Pendente" });
      setViewBudget((current) => current && current._id === id ? { ...current, status: "Pendente" } : current);
    },
    onSuccess: async (_, id) => {
      syncBudgetInCache(id, { status: "Pendente" });
      await refreshBudgets();
      toast({ title: "Orçamento enviado para aprovação!" });
    },
    onError: async () => {
      await refreshBudgets();
      toast({ variant: "destructive", title: "Erro ao enviar orçamento" });
    },
  });

  const approveBudget = useMutation({
    mutationFn: (id: string) => budgetService.approve(id, { status: "Aprovado" }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["budgets"] });
      syncBudgetInCache(id, { status: "Aprovado" });
      setViewBudget((current) => current && current._id === id ? { ...current, status: "Aprovado" } : current);
    },
    onSuccess: async (_, id) => {
      syncBudgetInCache(id, { status: "Aprovado" });
      await refreshBudgets();
      toast({ title: "Orçamento aprovado!" });
      setApproveTarget(null);
      setViewBudget(null);
    },
    onError: async () => {
      await refreshBudgets();
      toast({ variant: "destructive", title: "Erro ao aprovar orçamento" });
    },
  });

  const convertToSale = useMutation({
    mutationFn: async ({ budget, paymentMethod: selectedMethod }: { budget: Budget; paymentMethod: string }) => {
      const order = await saleService.create({
        customer: typeof budget.customer === "object" ? budget.customer?._id : budget.customer,
        paymentMethod: selectedMethod,
        paymentCondition,
        dueDate: paymentCondition === "prazo" ? dueDate : undefined,
        items: (budget.items || []).map((item) => ({
          product: typeof item.product === "object" ? item.product?._id : item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      console.log("Venda criada:", order);
      // support different response shapes: saleId or sale._id or _id
      const saleId = (order as any).saleId ?? (order as any).sale?._id ?? (order as any)._id;
      if (saleId) await orderService.confirmPayment(saleId);
    },
    onSuccess: async () => {
      await refreshBudgets();
      await qc.invalidateQueries({ queryKey: ["sales"] });
      await qc.refetchQueries({ queryKey: ["sales"], type: "active" });
      toast({ title: "Orçamento convertido em venda!" });
      setConvertTarget(null);
      setSelectedPayment("");
      setViewBudget(null);
      setPaymentMethod("");
    },
    onError: (error: any) =>
      toast({
        variant: "destructive",
        title: "Erro ao converter orçamento",
        description: error?.response?.data?.message || "Ocorreu um erro inesperado",
      }),
  });

  const addItem = () => setItems([...items, { product: "", productName: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) => {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const nextItems = [...items];
    (nextItems[index] as any)[field] = value;

    if (field === "product") {
      const product = products.data?.find((entry: any) => entry._id === value);
      if (product) {
        nextItems[index].unitPrice = product.salePrice;
        nextItems[index].productName = product.name;
      }
    }

    setItems(nextItems);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos um item" });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    setConfirmOpen(false);
    save.mutate({
      customer: customer || undefined,
      items: items.map((item) => ({ product: item.product, quantity: item.quantity, unitPrice: item.unitPrice })),
      notes: notes || undefined,
      validUntil: validUntil || undefined,
      status: "Rascunho",
    });
  };

  const openNew = () => {
    setEditId(null);
    setCustomer("");
    setItems([]);
    setNotes("");
    setValidUntil("");
    setOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditId(budget._id);
    setCustomer(typeof budget.customer === "object" ? budget.customer?._id : budget.customer || "");
    setNotes(budget.notes || "");
    setValidUntil(budget.validUntil ? budget.validUntil.slice(0, 10) : "");
    setItems((budget.items || []).map((item) => ({
      product: typeof item.product === "object" ? item.product?._id : item.product,
      productName: typeof item.product === "object" ? item.product?.name : "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })));
    setViewBudget(null);
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
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`orcamento-${viewBudget?._id?.slice(-8)}.pdf`);
    toast({ title: "PDF exportado!" });
  }, [viewBudget, toast]);

  return (
    <div className="flex flex-col">
      <AppHeader title="Orçamentos" />

      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "createdAt", label: "Data", render: (budget) => budget.createdAt ? new Date(budget.createdAt).toLocaleDateString("pt-BR") : "-" },
            { key: "customer", label: "Cliente", render: (budget) => typeof budget.customer === "object" ? budget.customer?.name : "-" },
            { key: "items", label: "Itens", render: (budget) => budget.items?.length ?? 0 },
            {
              key: "notes",
              label: "Notas",
              render: (budget) => budget.notes ? budget.notes.slice(0, 55) + (budget.notes.length > 50 ? "..." : "") : "Sem notas",
            },
            { key: "totalValue", label: "Total", render: (budget) => `R$ ${budget.totalValue?.toFixed(2)}` },
            { key: "status", label: "Status", render: (budget) => <Badge className={statusColors[budget.status] || ""}>{budget.status}</Badge> },
            {
              key: "_actions",
              label: "",
              render: (budget) => (
                <Button variant="ghost" size="icon" onClick={() => setViewBudget(budget)} title="Visualizar">
                  <Eye className="h-4 w-4" />
                </Button>
              ),
            },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          addLabel="Novo Orçamento"
        />
      </div>

      <Dialog open={!!viewBudget} onOpenChange={() => setViewBudget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orçamento</DialogTitle>
          </DialogHeader>

          {viewBudget && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                <Button variant="outline" size="sm" onClick={exportPNG}>
                  <FileImage className="mr-1 h-4 w-4" /> PNG
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  <FileText className="mr-1 h-4 w-4" /> PDF
                </Button>

                {viewBudget.status === "Rascunho" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white"
                    disabled={sendBudget.isPending}
                    onClick={() => sendBudget.mutate(viewBudget._id)}
                  >
                    <Send className="mr-1 h-4 w-4" /> {sendBudget.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                )}

                {viewBudget.status === "Pendente" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(viewBudget)}>
                      <Pencil className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => setApproveTarget(viewBudget)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                    </Button>
                  </>
                )}

                {viewBudget.status === "Aprovado" && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setConvertTarget(viewBudget)}
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" /> Converter em Venda
                  </Button>
                )}

                {viewBudget.status !== "Convertido" && (
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(viewBudget)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                  </Button>
                )}
              </div>

              <div ref={printRef} className="p-6 bg-background text-foreground">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{company.data?.companyName || "NexusSystems"}</h2>
                    {company.data?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {company.data.cnpj}</p>}
                    {company.data?.phone && <p className="text-xs text-muted-foreground">Tel: {company.data.phone}</p>}
                    {company.data?.email && <p className="text-xs text-muted-foreground">Email: {company.data.email}</p>}
                    {company.data?.address && <p className="text-xs text-muted-foreground">{company.data.address}</p>}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">ORÇAMENTO</p>
                    <p className="text-xs text-muted-foreground">Nº #{viewBudget._id?.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      Emissão: {viewBudget.createdAt ? new Date(viewBudget.createdAt).toLocaleDateString("pt-BR") : "-"}
                    </p>
                    <Badge className={`mt-1 ${statusColors[viewBudget.status] || ""}`}>{viewBudget.status}</Badge>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium text-foreground">{typeof viewBudget.customer === "object" ? viewBudget.customer?.name : "-"}</p>
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
                      {viewBudget.validUntil ? new Date(viewBudget.validUntil).toLocaleDateString("pt-BR") : "-"}
                    </p>
                  </div>
                </div>

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
                    {(viewBudget.items || []).map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-2 text-muted-foreground">{index + 1}</td>
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

                <div className="rounded-md border border-border bg-muted/30 p-3 mb-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    {viewBudget.validUntil
                      ? `Este orçamento é válido até ${new Date(viewBudget.validUntil).toLocaleDateString("pt-BR")}.`
                      : "Validade não informada. Consulte o emitente."}
                    {" "}Valores sujeitos a alteração sem aviso prévio após o vencimento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-8 mb-4">
                  <div className="text-center">
                    <div className="border-t border-foreground/30 pt-2 mx-4">
                      <p className="text-xs text-muted-foreground">{company.data?.companyName || "NexusSystems"}</p>
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
                  © {new Date().getFullYear()} {company.data?.companyName || "NexusSystems"} - Todos os direitos reservados.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {(customers.data || []).map((entry: any) => (
                      <SelectItem key={entry._id} value={entry._id}>{entry.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Condições, prazo de entrega..." />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex items-end gap-2 rounded-md border p-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Produto</Label>
                    <Select value={item.product} onValueChange={(value) => updateItem(index, "product", value)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {(products.data || []).map((entry: any) => (
                          <SelectItem key={entry._id} value={entry._id}>{entry.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(event) => updateItem(index, "quantity", +event.target.value)} />
                  </div>

                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Preço Unit.</Label>
                    <Input type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", +event.target.value)} />
                  </div>

                  <div className="w-24 text-right font-medium text-sm pb-2">
                    R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </div>

                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive">
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
        onConfirm={() => approveTarget && approveBudget.mutate(approveTarget._id)}
        title="Aprovar orçamento"
        description={`Deseja aprovar este orçamento de R$ ${approveTarget?.totalValue?.toFixed(2) || "0.00"}?`}
        confirmLabel="Aprovar"
        isPending={approveBudget.isPending}
      />

      <Dialog open={!!convertTarget} onOpenChange={() => { setConvertTarget(null); setSelectedPayment(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Converter orçamento de <span className="font-semibold text-foreground">R$ {convertTarget?.totalValue?.toFixed(2) || "0.00"}</span> em venda. Selecione a forma de pagamento:
            </p>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condição de Pagamento</Label>
              <Select value={paymentCondition} onValueChange={(value) => setPaymentCondition(value as "avista" | "prazo")}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="avista">À vista</SelectItem>
                  <SelectItem value="prazo">A prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentCondition === "prazo" && (
              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setConvertTarget(null); setSelectedPayment(""); }}>Cancelar</Button>
              <Button
                disabled={!selectedPayment || convertToSale.isPending}
                onClick={() => convertTarget && convertToSale.mutate({ budget: convertTarget, paymentMethod: selectedPayment })}
              >
                {convertToSale.isPending ? "Convertendo..." : "Confirmar Venda"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmSaveDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget._id);
            setDeleteTarget(null);
          }
        }}
        title="Excluir orçamento"
        description={`Tem certeza que deseja excluir o orçamento #${deleteTarget?._id?.slice(-8).toUpperCase() || ""}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
