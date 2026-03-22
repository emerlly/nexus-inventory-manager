import api from "./api";
import { createCrudService } from "./crudService";
import type { Order, OrderFormData } from "@/types";

// REMOVIDO: import desnecessário de 'dns'
const base = createCrudService<Order, OrderFormData>("/orders");

export const orderService = {
  ...base,

  updateStatus: async (id: string, data: { status: string }) => {
    const res = await api.patch(`/orders/${id}/update-status`, data);
    return res.data;
  },

  // CORRIGIDO: Rota de envio agora existe no backend (após adicionar a rota)
  send: async (id: string) => {
    const { data } = await api.patch(`/orders/${id}/send`);
    return data;
  },

  // CORRIGIDO: Era PATCH /sales/:id/confirm-payment
  // O backend espera PUT /orders/:id/confirm-payment
  confirmPayment: async (id: string) => {
    const res = await api.put(`/orders/${id}/confirm-payment`);
    return res.data;
  },
};
