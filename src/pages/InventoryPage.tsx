import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, type Inventory, type InventoryItem, type InventoryFormData } from "@/services/inventoryService";
import { productService } from "@/services/productService";
import { usePermissions } from "@/contexts/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, Eye, ClipboardEdit, FileCheck, Search, Save, SendHorizontal,
  CheckCircle2, RotateCcw, Package, AlertTriangle, TrendingDown, TrendingUp,
} from "lucide-react";
import type { Product } from "@/types";

/* ─── Status helpers ─── */
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN: { label: "Aberto", variant: "outline" },
  COUNTING: { label: "Em Contagem", variant: "secondary" },
  PENDING: { label: "Aguardando Aprovação", variant: "default" },
  APPROVED: { label: "Aprovado", variant: "secondary" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/* ─── Difference cell ─── */
function DiffCell({ diff }: { diff: number | null }) {
  if (diff === null || diff === undefined) return <span className="text-muted-foreground">—</span>;
  if (diff === 0) return <span className="font-medium">0</span>;
  if (diff < 0) return <span className="font-semibold text-destructive">{diff}</span>;
  return <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{diff}</span>;
}

/* ================================================================ */
export default function InventoryPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canApproveInventory = hasPermission(PERMISSIONS.INVENTORY_APPROVE);

  /* ─── State ─── */
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryFormData>({ name: "", location: "" });

  const [activeInventory, setActiveInventory] = useState<Inventory | null>(null);
  const [viewMode, setViewMode] = useState<"count" | "review" | null>(null);
  const [countItems, setCountItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [recountOpen, setRecountOpen] = useState(false);
  const [recountJustification, setRecountJustification] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Queries ─── */
  const { data: inventories = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["inventories"],
    queryFn: inventoryService.getAll,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: productService.getAll,
  });

  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};

    products.forEach((p) => {
      map[String(p._id)] = p;
    });

    return map;
  }, [products]);

  /* ─── Mutations ─── */
  const createMut = useMutation({
    mutationFn: inventoryService.create,
    onSuccess: (inv: Inventory) => {
      qc.invalidateQueries({ queryKey: ["inventories"] });
      setCreateOpen(false);
      setFormData({ name: "", location: "" });
      toast({ title: "Inventário criado", description: "Comece a contagem agora." });
      openCount(inv);
    },
  });

  const saveMut = useMutation({
    mutationFn: ({ id, items }: { id: string; items: InventoryItem[] }) =>
      inventoryService.updateItems(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventories"] });
      toast({ title: "Progresso salvo" });
    },
  });

  const finalizeMut = useMutation({
    mutationFn: (id: string) => inventoryService.finalize(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventories"] });
      setViewMode(null);
      setActiveInventory(null);
      toast({ title: "Contagem finalizada", description: "Enviado para aprovação." });
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => inventoryService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventories"] });
      setViewMode(null);
      setActiveInventory(null);
      toast({ title: "Inventário aprovado", description: "Estoque ajustado com sucesso." });
    },
  });

  const recountMut = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      inventoryService.recount(id, justification),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventories"] });
      setRecountOpen(false);
      setRecountJustification("");
      setViewMode(null);
      setActiveInventory(null);
      toast({ title: "Recontagem solicitada" });
    },
  });

  /* ─── Helpers ─── */
  const openCount = useCallback((inv: Inventory) => {
    const items: InventoryItem[] = inv.items?.length
      ? inv.items.map((item) => {
        const product = productMap[String(item.product)];

        return {
          ...item,
          name: product?.name || "Produto não encontrado",
          SKU: product?.SKU || "",
        };
      })
      : products.map((p) => ({
        product: p._id,
        name: p.name,
        SKU: p.SKU || "",
        systemQuantity: p.stock?.physical ?? 0,
        countedQuantity: null,
        difference: 0,
      }));

    setCountItems(items);
    setActiveInventory(inv);
    setViewMode("count");
    setSearchTerm("");
  }, [products, productMap]);

  const openReview = useCallback((inv: Inventory) => {
    const items = (inv.items || []).map((item) => {
      const product = productMap[String(item.product)];

      return {
        ...item,
        name: product?.name || "Produto não encontrado",
        SKU: product?.SKU || "",
      };
    });

    setActiveInventory(inv);
    setCountItems(items);
    setViewMode("review");
    setSearchTerm("");
  }, [productMap]);

  const updateCount = useCallback((index: number, value: string) => {
    setCountItems((prev) => {
      const next = [...prev];
      const counted = value === "" ? null : Number(value);
      next[index] = {
        ...next[index],
        countedQuantity: counted,
        difference: counted !== null ? counted - next[index].systemQuantity : 0,
      };
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  }, []);

  /* ─── Filtered items ─── */
  const filteredItems = useMemo(() => {
    if (!searchTerm) return countItems;
    const s = searchTerm.toLowerCase();
    return countItems.filter(
      (i) => i.name.toLowerCase().includes(s) || i.SKU.toLowerCase().includes(s)
    );
  }, [countItems, searchTerm]);

  /* ─── Review stats ─── */
  const stats = useMemo(() => {
    const divergent = countItems.filter((i) => i.difference !== 0);
    const losses = countItems.filter((i) => i.difference < 0).reduce((s, i) => s + i.difference, 0);
    const gains = countItems.filter((i) => i.difference > 0).reduce((s, i) => s + i.difference, 0);
    return { divergent: divergent.length, losses, gains };
  }, [countItems]);

  const readOnly = viewMode === "review" || activeInventory?.status === "Pendente" || activeInventory?.status === "Aprovado";

  /* ─── LIST VIEW ─── */
  if (!viewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventário</h1>
            <p className="text-sm text-muted-foreground">Controle de contagem física e aprovação</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Inventário
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
                ) : inventories.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum inventário encontrado</TableCell></TableRow>
                ) : (
                  inventories.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-medium">{inv.name}</TableCell>
                      <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell>{typeof inv.responsibleUser === "object" ? inv.responsibleUser?.name : "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {(inv.status === "Aberto" || inv.status === "Contagem") && (
                          <Button size="sm" variant="outline" onClick={() => openCount(inv)}>
                            <ClipboardEdit className="mr-1 h-3.5 w-3.5" /> Contar
                          </Button>
                        )}
                        {(inv.status === "Pendente" || inv.status === "Aprovado") && (
                          <Button size="sm" variant="outline" onClick={() => openReview(inv)}>
                            {canApproveInventory ? <FileCheck className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                            {canApproveInventory && inv.status === "Pendente" ? "Revisar" : "Visualizar"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Inventário</DialogTitle>
              <DialogDescription>Informe os dados para iniciar a contagem.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do inventário *</Label>
                <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Contagem Mensal Jun/2026" />
              </div>
              <div>
                <Label>Local (opcional)</Label>
                <Input value={formData.location || ""} onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))} placeholder="Ex: Depósito principal" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate(formData)} disabled={!formData.name || createMut.isPending}>
                {createMut.isPending ? "Criando…" : "Iniciar Inventário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ─── COUNTING / REVIEW VIEW ─── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button onClick={() => { setViewMode(null); setActiveInventory(null); }} className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1">
            ← Voltar
          </button>
          <h1 className="text-xl font-bold text-foreground">{activeInventory?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={activeInventory?.status || "OPEN"} />
            {activeInventory?.location && <span className="text-xs text-muted-foreground">📍 {activeInventory.location}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {viewMode === "count" && !readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => saveMut.mutate({ id: activeInventory!._id, items: countItems })} disabled={saveMut.isPending}>
                <Save className="mr-1 h-3.5 w-3.5" /> {saveMut.isPending ? "Salvando…" : "Salvar Progresso"}
              </Button>
              <Button size="sm" onClick={() => setConfirmFinalize(true)}>
                <SendHorizontal className="mr-1 h-3.5 w-3.5" /> Finalizar Contagem
              </Button>
            </>
          )}
          {viewMode === "review" && canApproveInventory && activeInventory?.status === "Pendente" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setRecountOpen(true)}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Solicitar Recontagem
              </Button>
              <Button size="sm" onClick={() => setConfirmApprove(true)}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Aprovar Inventário
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recount justification banner */}
      {activeInventory?.recountJustification && activeInventory.status === "Contagem" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Recontagem solicitada</p>
              <p className="text-sm text-muted-foreground">{activeInventory.recountJustification}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review stats */}
      {viewMode === "review" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Divergências
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{stats.divergent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" /> Perdas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Sobras
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{stats.gains}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por produto ou SKU…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-24">SKU</TableHead>
                <TableHead className="w-32 text-center">Estoque Sistema</TableHead>
                <TableHead className="w-40 text-center">Qtd Contada</TableHead>
                <TableHead className="w-28 text-center">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, idx) => {
                const realIdx = countItems.indexOf(item);
                return (
                  <TableRow key={item.product} className={
                    item.countedQuantity !== null && item.difference !== 0
                      ? item.difference < 0
                        ? "bg-destructive/5"
                        : "bg-emerald-500/5"
                      : ""
                  }>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.SKU || "—"}</TableCell>
                    <TableCell className="text-center tabular-nums">{item.systemQuantity}</TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <span className="tabular-nums font-medium">{item.countedQuantity ?? "—"}</span>
                      ) : (
                        <Input
                          ref={(el) => { inputRefs.current[realIdx] = el; }}
                          type="number"
                          min={0}
                          className="h-10 text-center text-base tabular-nums w-24 mx-auto"
                          value={item.countedQuantity ?? ""}
                          onChange={(e) => updateCount(realIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, realIdx)}
                          placeholder="0"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DiffCell diff={item.countedQuantity !== null ? item.difference : null} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Finalize confirm */}
      <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar contagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Após finalizar, a contagem será enviada para aprovação e não poderá mais ser editada até que uma recontagem seja solicitada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const hasCounted = countItems.some(i => i.countedQuantity !== null);

              console.log("sla", hasCounted)
              if (!hasCounted) {
                toast({
                  title: "Atenção",
                  description: "Você precisa contar pelo menos 1 item antes de finalizar.",
                  variant: "destructive"
                });
                return;
              } 
              saveMut.mutate(
                { id: activeInventory!._id, items: countItems },
                {
                  onSuccess: () => finalizeMut.mutate(activeInventory!._id),
                }
              );
            }}>
              Finalizar e Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve confirm */}
      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar inventário?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja aplicar os ajustes de estoque com base neste inventário? Esta ação gerará movimentações de estoque automaticamente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => approveMut.mutate(activeInventory!._id)}>
              Aprovar e Ajustar Estoque
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recount dialog */}
      <Dialog open={recountOpen} onOpenChange={setRecountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Recontagem</DialogTitle>
            <DialogDescription>Informe o motivo para que o estoquista realize nova contagem.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Justificativa *</Label>
            <Textarea value={recountJustification} onChange={(e) => setRecountJustification(e.target.value)} placeholder="Ex: Divergência acima de 5% nos itens da categoria X" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecountOpen(false)}>Cancelar</Button>
            <Button onClick={() => recountMut.mutate({ id: activeInventory!._id, justification: recountJustification })} disabled={!recountJustification.trim() || recountMut.isPending}>
              {recountMut.isPending ? "Enviando…" : "Solicitar Recontagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}