import api from "./api";

export type InventoryStatus = "Aberto" | "Contagem" | "Pendente" | "Aprovado" | "Cancelado";

export interface InventoryItem {
  product: string;
  name: string;
  SKU: string;
  systemQuantity: number;
  countedQuantity: number | null;
  difference: number;
}

export interface Inventory {
  _id: string;
  name: string;
  location?: string;
  status: InventoryStatus;
  responsibleUser?: { _id: string; name: string } | string;
  items: InventoryItem[];
  recountJustification?: string;
  approvedBy?: { _id: string; name: string } | string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryFormData {
  name: string;
  location?: string;
}

export const inventoryService = {
  getAll: () => api.get("/inventories").then((r) => r.data),
  getById: (id: string) => api.get(`/inventories/${id}`).then((r) => r.data),
  create: (data: InventoryFormData) => api.post("/inventories", data).then((r) => r.data),
  updateItems: (id: string, items: InventoryItem[]) =>
    api.patch(`/inventories/${id}/update`, { items }).then((r) => r.data),
  finalize: (id: string) =>
    api.put(`/inventories/${id}/finalize`).then((r) => r.data),
  approve: (id: string) =>
    api.put(`/inventories/${id}/approve`).then((r) => r.data),
  recount: (id: string, justification: string) =>
    api.put(`/inventories/${id}/recount`, { justification }).then((r) => r.data),
  delete: (id: string) => api.delete(`/inventories/${id}`).then((r) => r.data),
  submit: (id: string, items: InventoryItem[]) =>
    api.patch(`/inventories/${id}/submit`, { items }).then((r) => r.data)
}
