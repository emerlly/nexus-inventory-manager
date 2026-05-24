import api from "./api";
import { createCrudService } from "./crudService";
import type { Product, ProductFormData } from "@/types";
import { extractList, handleApiError, type ApiResponse } from "@/utils/apiClient";

const base = createCrudService<Product, ProductFormData>("/products");

export const productService = {
  ...base,
  getLowStockPage: async (page = 1, limit = 50) => {
    try {
      const response = await api.get<ApiResponse<Product[]>>("/products", {
        params: { lowStock: true, page, limit },
      });
      return extractList<Product>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  getLowStock: async () => {
    const page = await productService.getLowStockPage(1, 50);
    return page.items;
  },
};
