import api from "./api";
import { createCrudService } from "./crudService";
import type { Product, ProductFormData } from "@/types";

const base = createCrudService<Product, ProductFormData>("/products");

export const productService = {
  ...base,
  getLowStock: async () => {
    const { data } = await api.get("/products", { params: { lowStock: true } });
    return data;
  },
};
