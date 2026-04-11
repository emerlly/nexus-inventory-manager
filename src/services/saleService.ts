import api from "./api";
import { createCrudService } from "./crudService";
import type { Sale, SaleFormData } from "@/types";

const base = createCrudService<Sale, SaleFormData>("/sales");

const unwrap = <T>(payload: unknown, fallback: T): T => {
  if (payload == null) return fallback;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const maybeData = (payload as { data?: unknown }).data;
    if (maybeData !== undefined) return maybeData as T;
  }
  return payload as T;
};

export const saleService = {
  ...base,

  getPaymentMethods: async () => {
    const { data } = await api.get("/sales/payment-methods");
    return Array.isArray(data) ? data : unwrap<string[]>(data, []);
  },

  // CORRIGIDO: Era api.post('/payment/...') — rota incorreta (singular e sem 's')
  // A rota correta no backend é POST /payments/:id/confirm-payment
  confirmPayment: async (orderId: string) => {
    const { data } = await api.post(`/payments/${orderId}/confirm-payment`);
    return unwrap<Record<string, unknown>>(data, {});
  },
};
