import api from "./api";
import { createCrudService } from "./crudService";
import type { Sale, SaleFormData } from "@/types";

const base = createCrudService<Sale, SaleFormData>("/sales");

export const saleService = {
  ...base,

  getPaymentMethods: async () => {
    const { data } = await api.get("/sales/payment-methods");
    return data;
  },

  // CORRIGIDO: Era api.post('/payment/...') — rota incorreta (singular e sem 's')
  // A rota correta no backend é POST /payments/:id/confirm-payment
  confirmPayment: async (orderId: string) => {
    const { data } = await api.post(`/payments/${orderId}/confirm-payment`);
    return data;
  },

  getAll: async () => {
    const { data } = await api.get("/sales");
    return data;
  },
};
