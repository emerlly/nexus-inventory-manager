import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { saleService, customerService, productService } from "@/services";
import type { Sale, SaleFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";
import { PAYMENT_METHODS, PAYMENT_CONDITIONS, getConditionForMethod } from "@/config/paymentOptions";

interface SaleItemForm {
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
  const [items, setItems] = useState<SaleItemForm[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data = [], isLoading } = useQuery({ queryKey: ["sales"], queryFn: saleService.getAll });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const products = useQuery({ queryKey: ["products"], queryFn: productService.getAll });

  const filteredSales = useMemo(() => {
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");
    return (data as Sale[]).filter(s => {
      const d = (s.createdAt || "").split("T")[0];
      return d >= startStr && d <= endStr;
    });
  }, [data, startDate, endDate]);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentCondition, setPaymentCondition] = useState<"avista" | "prazo">("avista");
  const [dueDate, setDueDate] = useState("");

  const createSale = useMutation({
    mutationFn: (d: SaleFormData) => saleService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orderS"] });
      setOpen(false);
      toast({ title: "Venda registrada com sucesso!" });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao registrar venda" }),
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

  const openNew = () => { setCustomer(""); setItems([]); setPaymentMethod(""); setPaymentCondition("avista"); setDueDate(""); setOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast({ variant: "destructive", title: "Adicione ao menos um item" }); return; }
    setConfirmOpen(true);
  };

  const confirmSale = () => {
    setConfirmOpen(false);
    createSale.mutate({
      customer: customer || undefined,
      paymentMethod,
      paymentCondition,
      dueDate: paymentCondition === "prazo" ? dueDate : undefined,
      items: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    });
  }
    // Payment methods from config

    const columns = [
      { key: "customer", label: "Cliente", render: (sale: Sale) => typeof sale.customer === "object" ? sale.customer?.name : "—" },
      { key: "totalValue", label: "Total", render: (sale: Sale) => `R$ ${sale.totalValue?.toFixed(2)}` },
      { key: "seller", label: "Vendedor", render: (sale: Sale) => typeof sale.seller === "object" ? sale.seller?.name : "—" },
      { key: "createdAt", label: "Data", render: (sale: Sale) => sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("pt-BR") : "—" },
    ];

    const getDetailFields = (sale: Sale) => [
      { label: "Data", value: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("pt-BR") : "—" },
      { label: "Cliente", value: typeof sale.customer === "object" ? sale.customer?.name : "—" },
      { label: "Total", value: `R$ ${sale.totalValue?.toFixed(2)}` },
      { label: "Vendedor", value: typeof sale.seller === "object" ? sale.seller?.name : "—" },
    ];

    const getDetailItems = (sale: Sale) => ({
      columns: [
        { key: "product", label: "Produto" },
        { key: "quantity", label: "Qtd" },
        { key: "unitPrice", label: "Preço Unit." },
        { key: "total", label: "Subtotal" },
      ],
      data: (sale.items || []).map((item) => ({
        product: typeof item.product === "object" ? item.product?.name : item.product,
        quantity: item.quantity,
        unitPrice: `R$ ${item.unitPrice?.toFixed(2)}`,
        total: `R$ ${(item.quantity * item.unitPrice).toFixed(2)}`,
      })),
    });

    return (
      <div className="flex flex-col">
        <AppHeader title="Vendas" />
        <div className="flex-1 p-6 space-y-4">
          {/* Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start">
                  <CalendarIcon className="mr-2 h-3 w-3" />{format(startDate, "dd/MM/yy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={d => d && setStartDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start">
                  <CalendarIcon className="mr-2 h-3 w-3" />{format(endDate, "dd/MM/yy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={d => d && setEndDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <DataTable
            columns={columns}
            data={filteredSales}
            loading={isLoading}
            onAdd={openNew}
            addLabel="Nova Venda"
            getDetailFields={getDetailFields}
            getDetailItems={getDetailItems}
          />
        </div>

        {/* Direct Sale Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Venda Direta</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label>Itens da Venda</Label>
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
                      <Input type="number" step="0.01" value={item.unitPrice} disabled onChange={(e) => updateItem(i, "unitPrice", +e.target.value)} />
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
              <div className="space-y-2 border-t pt-4">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v) => {
                  setPaymentMethod(v);
                  setPaymentCondition(getConditionForMethod(v));
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição</Label>
                  <Select value={paymentCondition} onValueChange={(v) => setPaymentCondition(v as "avista" | "prazo")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {paymentCondition === "prazo" && (
                  <div className="space-y-2">
                    <Label>Data de Vencimento</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-lg font-bold">Total: R$ {total.toFixed(2)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createSale.isPending}>
                    {createSale.isPending ? "Registrando..." : "Registrar Venda"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmSaveDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={confirmSale}
          title="Confirmar venda"
          description={`Deseja registrar esta venda no valor de R$ ${total.toFixed(2)} para o cliente ${customers.data?.find((c: any) => c._id === customer)?.name}?`}
          confirmLabel="Registrar Venda"
          isPending={createSale.isPending}
        />
      </div>
    );
  }
