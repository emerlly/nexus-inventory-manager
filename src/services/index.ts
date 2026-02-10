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
export const categoryService = createCrudService<Category, CategoryFormData>("/categories/");
export const customerService = createCrudService<Customer, CustomerFormData>("/customers");
export const supplierService = createCrudService<Supplier, SupplierFormData>("/suppliers");
export const stockMovementService = createCrudService<StockMovement, StockMovementFormData>("/stock/history");
export const saleService = createCrudService<Sale, SaleFormData>("/sales" as string);

console.log("categoryService", categoryService);

export const reportService = {
  salesByPeriod: () => api.get("/reports/sales").then(r => r.data), //mudar aqui, precisa criar uma rota específica para isso no backend
  salesByProduct: () => api.get("/reports/sales").then(r => r.data), //mudar aqui, precisa criar uma rota específica para isso no backend
  salesByUser: () => api.get("/reports/sales-by-seller").then(r => r.data),
  profitByPeriod: () => api.get("/reports/seller").then(r => r.data),
  stockLow: () => api.get("/reports/low-stock").then(r => r.data),

};
