import { promises } from "dns";
import api from "./api";
import { createCrudService } from "./crudService";
import type { Order, OrderFormData } from "@/types";

const base = createCrudService<Order, OrderFormData>("/orders");

export const orderService = {
  ...base,
  updateStatus: async (id: string, data: { status: string }) => {
    const res = await api.patch(`/orders/${id}/status`, data);
    return res.data;
  },
  send: async (id: string ) => {
    const { data } = await api.patch(`/orders/${id}/send`);
    return data;
  },
  confirmPayment: async (id: string) => {
    const res = await api.patch(`/sales/${id}/confirm-payment`);
    return res.data;
  }
};
