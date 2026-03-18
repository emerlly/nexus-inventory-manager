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
  confirmPayment: (orderId: string) =>
    api.post(`/sales/${orderId}/confirm-payment`),
};
