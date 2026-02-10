import { createCrudService } from "./crudService";
import api from "./api";
import type {
  User, UserFormData,
  Product, ProductFormData,
  Category, CategoryFormData,
  Customer, CustomerFormData,
  Supplier, SupplierFormData,
  StockMovement, StockMovementFormData,
  Sale, SaleFormData,
} from "@/types";

export { authService } from "./authService";

export const userService = createCrudService<User, UserFormData>("/users");
export const productService = createCrudService<Product, ProductFormData>("/products");
export const categoryService = createCrudService<Category, CategoryFormData>("/categories");
export const customerService = createCrudService<Customer, CustomerFormData>("/customers");
export const supplierService = createCrudService<Supplier, SupplierFormData>("/suppliers");
export const stockMovementService = createCrudService<StockMovement, StockMovementFormData>("/stock/movements");
export const saleService = createCrudService<Sale, SaleFormData>("/sales" as string);

export const reportService = {
  salesByPeriod: () => api.get("/reports/sales-by-period").then(r => r.data),
  salesByProduct: () => api.get("/reports/sales-by-product").then(r => r.data),
  salesByUser: () => api.get("/reports/sales-by-user").then(r => r.data),
  profitByPeriod: () => api.get("/reports/profit-by-period").then(r => r.data),
  stockLow: () => api.get("/reports/stock-low").then(r => r.data),
};
