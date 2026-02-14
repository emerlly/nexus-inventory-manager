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
  Order, OrderFormData, OrderStatus,
  Payment, PaymentFormData,
  Company,
} from "@/types";

export { authService } from "./authService";

export const userService = createCrudService<User, UserFormData>("/users");
export const productService = createCrudService<Product, ProductFormData>("/products");
export const categoryService = createCrudService<Category, CategoryFormData>("/categories");
export const customerService = createCrudService<Customer, CustomerFormData>("/customers");
export const supplierService = createCrudService<Supplier, SupplierFormData>("/suppliers");
export const stockMovementService = createCrudService<StockMovement, StockMovementFormData>("/stock/history");
export const saleService = createCrudService<Sale, SaleFormData>("/sales" as string);
//export const orderService = createCrudService<Order, OrderFormData>("/quotes");
export const paymentService = createCrudService<Payment, PaymentFormData>("/payments");

export const companyService = {
  get: () => api.get("/company").then((r) => r.data),
  update: (data: Partial<Company>) => api.put("/company", data).then((r) => r.data),
};

export const reportService = {
  
  salesByPeriod: (start?: string, end?: string) =>
    api.get("/reports/sales-by-period", {
        params: { startDate: start, endDate: end },
      })
      .then((r) => r.data),
      

  salesByProduct: () =>
    api.get("/reports/sales").then((r) => r.data),

  salesByUser: () =>
    api.get("/reports/sales-by-user").then((r) => r.data),

  profitByPeriod: (start?: string, end?: string) =>
    api
      .get("/reports/profit-by-period", {
        params: { start, end },
      })
      .then((r) => r.data),

  stockLow: () =>
    api.get("/reports/low-stock").then((r) => r.data),
};


export const orderService = {
  getAll: async (): Promise<Order[]> => {
    const res = await api.get("/orders");
    return res.data;
  },

  create: async (data: OrderFormData): Promise<Order> => {
    const res = await api.post("/orders", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const res = await api.put(`/orders/${id}`, data);
    return res.data;
  },
};
