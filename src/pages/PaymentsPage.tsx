import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { paymentService, customerService, supplierService } from "@/services";
import type { Payment, PaymentFormData, PaymentStatus, PaymentType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

const statusColors: Record<PaymentStatus, string> = {
  pendente: "bg-warning/15 text-warning border-warning/30",
  pago: "bg-success/15 text-success border-success/30",
  atrasado: "bg-destructive/15 text-destructive border-destructive/30",
  cancelado: "bg-muted text-muted-foreground",
};

const typeLabels: Record<PaymentType, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

const defaultForm: PaymentFormData = {
  description: "",
  type: "receita",
  amount: 0,
  status: "pendente",
  dueDate: new Date().toISOString().split("T")[0],
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState<PaymentFormData>(defaultForm);
  const [tab, setTab] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data = [], isLoading } = useQuery({ queryKey: ["payments"], queryFn: paymentService.getAll });
  const customers = useQuery({ queryKey: ["customers"], queryFn: customerService.getAll });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: supplierService.getAll });

  const save = useMutation({
    mutationFn: (d: PaymentFormData) => editing ? paymentService.update(editing._id, d) : paymentService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); setOpen(false); toast({ title: "Salvo!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (p: Payment) => paymentService.remove(p._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast({ title: "Excluído!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao excluir" }),
  });

  const openNew = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (p: Payment) => {
    setEditing(p);
    setForm({
      description: p.description, type: p.type, amount: p.amount, status: p.status,
      dueDate: p.dueDate?.split("T")[0] || "",
      customer: typeof p.customer === "object" ? p.customer?._id : p.customer,
      supplier: typeof p.supplier === "object" ? p.supplier?._id : p.supplier,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const filtered = tab === "all" ? data : data.filter((p: Payment) => p.type === tab);

  return (
    <div className="flex flex-col">
      <AppHeader title="Pagamentos" />
      <div className="flex-1 p-6 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="receita">Receitas</TabsTrigger>
            <TabsTrigger value="despesa">Despesas</TabsTrigger>
          </TabsList>
        </Tabs>

        <DataTable
          columns={[
            { key: "description", label: "Descrição" },
            { key: "type", label: "Tipo", render: (p: Payment) => <Badge variant={p.type === "receita" ? "default" : "secondary"}>{typeLabels[p.type]}</Badge> },
            { key: "amount", label: "Valor", render: (p: Payment) => `R$ ${p.amount?.toFixed(2)}` },
            { key: "dueDate", label: "Vencimento", render: (p: Payment) => p.dueDate ? new Date(p.dueDate).toLocaleDateString("pt-BR") : "—" },
            { key: "status", label: "Status", render: (p: Payment) => <Badge className={statusColors[p.status]}>{p.status}</Badge> },
          ]}
          data={filtered}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(p) => del.mutate(p)}
          addLabel="Novo Pagamento"
          searchPlaceholder="Buscar pagamentos..."
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PaymentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PaymentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.type === "receita" && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.customer || ""} onValueChange={(v) => setForm({ ...form, customer: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{customers.data?.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {form.type === "despesa" && (
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={form.supplier || ""} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{suppliers.data?.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => { setConfirmOpen(false); save.mutate(form); }}
        title={editing ? "Confirmar edição" : "Confirmar cadastro"}
        description={editing ? "Deseja salvar as alterações deste pagamento?" : "Deseja cadastrar este novo pagamento?"}
        isPending={save.isPending}
      />
    </div>
  );
}
