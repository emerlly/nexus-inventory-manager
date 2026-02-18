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
  Order, OrderFormData,
  Payment, PaymentFormData,
  Company,
} from "@/types";

export { authService } from "./authService";

/* ================= CRUD ================= */

export const userService = createCrudService<User, UserFormData>("/users");
export const productService = createCrudService<Product, ProductFormData>("/products");
export const categoryService = createCrudService<Category, CategoryFormData>("/categories");
export const customerService = createCrudService<Customer, CustomerFormData>("/customers");
export const supplierService = createCrudService<Supplier, SupplierFormData>("/suppliers");
export const stockMovementService = createCrudService<StockMovement, StockMovementFormData>("/stock/history");
export const saleService = createCrudService<Sale, SaleFormData>("/sales");
export const orderService = createCrudService<Order, OrderFormData>("/orders");
export const paymentService = createCrudService<Payment, PaymentFormData>("/payments");

/* ================= BUDGET ================= */

export const budgetService = {
  getAll: () => api.get("/quotes").then((r) => r.data),
  getById: (id: string) => api.get(`/quotes/${id}`).then((r) => r.data),
  create: (data: any) => api.post("/quotes", data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/quotes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/quotes/${id}`).then((r) => r.data),
};

/* ================= COMPANY ================= */

export const companyService = {
  get: () => api.get("/company").then((r) => r.data),
  update: (data: Partial<Company>) =>
    api.put("/company", data).then((r) => r.data),
};

/* ================= ANALYTICS ================= */

export type AnalyticsSource = "reports" | "dashboard";

const buildBase = (source: AnalyticsSource = "dashboard") => `/${source}`;

const request = (url: string, params?: any) =>
  api.get(url, { params }).then((r) => r.data);

export const analyticsService = {

  summary: (start?: string, end?: string) =>
    request("/dashboard/summary", {
      startDate: start,
      endDate: end,
    }),
    
  salesByPeriod: (
    start?: string,
    end?: string,
    source: AnalyticsSource = "dashboard"
  ) =>
    request(`${buildBase(source)}/sales-by-period`, {
      startDate: start,
      endDate: end,
    }),

  salesByProduct: (
    start?: string,
    end?: string,
    limit = 5,
    source: AnalyticsSource = "dashboard"
  ) =>
    request(`${buildBase(source)}/top-products`, {
      startDate: start,
      endDate: end,
      limit,
    }),

  stockLow: (source: AnalyticsSource = "dashboard") =>
    request(`${buildBase(source)}/alerts`),

  salesByUser: (source: AnalyticsSource = "reports") =>
    request(`${buildBase(source)}/sales-by-user`),

  profitByPeriod: (
    start?: string,
    end?: string,
    source: AnalyticsSource = "dashboard"
  ) =>
    request(`${buildBase(source)}/profit-by-period`, {
      startDate: start,
      endDate: end,
    }),

};

export const reportService = analyticsService;
