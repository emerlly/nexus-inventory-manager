import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, GripVertical, Clock } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

export const KANBAN_COLUMNS: { key: OrderStatus; label: string; tone: string; bar: string }[] = [
  { key: "Reservado", label: "Reservado", tone: "bg-amber-50 dark:bg-amber-950/20", bar: "bg-amber-500" },
  { key: "Separando", label: "Em Separação", tone: "bg-blue-50 dark:bg-blue-950/20", bar: "bg-blue-500" },
  { key: "Faturado", label: "Faturado", tone: "bg-violet-50 dark:bg-violet-950/20", bar: "bg-violet-500" },
  { key: "Enviado", label: "Enviado", tone: "bg-indigo-50 dark:bg-indigo-950/20", bar: "bg-indigo-500" },
  { key: "Entregue", label: "Entregue", tone: "bg-emerald-50 dark:bg-emerald-950/20", bar: "bg-emerald-500" },
  { key: "Cancelado", label: "Cancelado", tone: "bg-red-50 dark:bg-red-950/20", bar: "bg-red-500" },
];

function isOverdue(order: Order) {
  if (!order.createdAt) return false;
  if (["Entregue", "Cancelado"].includes(order.status)) return false;
  const days = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 7;
}

function OrderCard({
  order,
  onOpen,
  dragging,
}: {
  order: Order;
  onOpen: (o: Order) => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order._id });
  const customerName = typeof order.customer === "object" ? order.customer?.name : "—";
  const overdue = isOverdue(order);

  return (
    <div
      ref={setNodeRef}
      className={`group rounded-lg border bg-card p-3 shadow-sm transition ${
        isDragging || dragging ? "opacity-50 ring-2 ring-primary" : "hover:shadow-md"
      } ${overdue ? "border-l-4 border-l-destructive" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label="Arrastar"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-muted-foreground truncate">
              #{order._id.slice(-8)}
            </span>
            {overdue && (
              <Badge variant="destructive" className="h-5 gap-1 px-1.5 text-[10px]">
                <Clock className="h-3 w-3" /> Atrasado
              </Badge>
            )}
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">{customerName}</p>
          <p className="text-xs text-muted-foreground">
            {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition group-hover:opacity-100"
          onClick={() => onOpen(order)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "—"}
        </span>
        <span className="text-sm font-semibold text-primary">
          R$ {order.totalValue?.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function Column({
  column,
  orders,
  onOpen,
}: {
  column: typeof KANBAN_COLUMNS[number];
  orders: Order[];
  onOpen: (o: Order) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const total = orders.reduce((s, o) => s + (o.totalValue || 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30">
      <div className={`flex items-center justify-between rounded-t-lg border-b px-3 py-2 ${column.tone}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.bar}`} />
          <h3 className="text-sm font-semibold">{column.label}</h3>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {orders.length}
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          R$ {total.toFixed(2)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition ${
          isOver ? "bg-primary/5 ring-2 ring-inset ring-primary/40" : ""
        }`}
        style={{ minHeight: 400, maxHeight: "calc(100vh - 280px)" }}
      >
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} onOpen={onOpen} />
        ))}
        {orders.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
            Sem pedidos
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderKanban({
  orders,
  onStatusChange,
  onOpen,
}: {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus, prev: OrderStatus) => void;
  onOpen: (o: Order) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Order[]> = {};
    KANBAN_COLUMNS.forEach((c) => (map[c.key] = []));
    orders.forEach((o) => {
      if (map[o.status]) map[o.status].push(o);
    });
    return map;
  }, [orders]);

  const activeOrder = orders.find((o) => o._id === activeId) || null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const order = orders.find((o) => o._id === active.id);
    if (!order) return;
    const newStatus = String(over.id) as OrderStatus;
    if (order.status === newStatus) return;
    onStatusChange(order._id, newStatus, order.status);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {KANBAN_COLUMNS.map((col) => (
          <Column key={col.key} column={col} orders={grouped[col.key] || []} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>
        {activeOrder && <OrderCard order={activeOrder} onOpen={onOpen} dragging />}
      </DragOverlay>
    </DndContext>
  );
}
