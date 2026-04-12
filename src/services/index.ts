import { createCrudService } from "./crudService";
import api from "./api";
import type {
  User, UserFormData,
  Category, CategoryFormData,
  Customer, CustomerFormData,
  Supplier, SupplierFormData,
  StockMovement, StockMovementFormData,
  Payment, PaymentFormData,
  Company,
} from "@/types";

export { authService } from "./authService";
export { orderService } from "./orderService";
export { saleService } from "./saleService";
export { productService } from "./productService";

/* ================= Shared response adapters ================= */

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  items?: T extends Array<unknown> ? T : never;
  meta?: Record<string, unknown>;
};

const unwrap = <T>(payload: unknown, fallback: T): T => {
  if (payload == null) return fallback;
  if (typeof payload === "object" && payload !== null) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data !== undefined) return envelope.data;
  }
  return payload as T;
};

const unwrapArray = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const envelope = payload as ApiEnvelope<T[]> & { data?: { items?: T[] } };
    if (Array.isArray(envelope.items)) return envelope.items;
    if (Array.isArray(envelope.data)) return envelope.data;
    if (Array.isArray(envelope.data?.items)) return envelope.data.items;
    if (envelope.data && typeof envelope.data === "object" && Array.isArray((envelope.data as { items?: T[] }).items)) return (envelope.data as { items?: T[] }).items;
  }
  return [];
};

const n = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const firstDefinedNumber = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

/* ================= CRUD ================= */

export const userService = createCrudService<User, UserFormData>("/users");
export const categoryService = createCrudService<Category, CategoryFormData>("/categories");
export const customerService = createCrudService<Customer, CustomerFormData>("/customers");
export const supplierService = createCrudService<Supplier, SupplierFormData>("/suppliers");
export const stockMovementService = createCrudService<StockMovement, StockMovementFormData>("/stock/history");
export const paymentService = {
  ...createCrudService<Payment, PaymentFormData>("/payments"),
  getPendents: async () => {
    const res = await api.get("/payments/pendents");
    return unwrapArray<Payment>(res.data);
  },
};

/* ================= BUDGET ================= */

export const budgetService = {
  getAll: async () => unwrapArray(await api.get("/quotes").then((r) => r.data)),
  getById: async (id: string) => unwrap(await api.get(`/quotes/${id}`).then((r) => r.data), {}),
  create: async (data: unknown) => unwrap(await api.post("/quotes", data).then((r) => r.data), {}),
  update: async (id: string, data: unknown) => unwrap(await api.put(`/quotes/${id}`, data).then((r) => r.data), {}),
  delete: async (id: string) => unwrap(await api.delete(`/quotes/${id}`).then((r) => r.data), {}),
  approve: async (id: string, data: unknown) => unwrap(await api.put(`/quotes/${id}/approve`, data).then((r) => r.data), {}),
};

/* ================= COMPANY ================= */

export const companyService = {
  get: async () => unwrap<Company>(await api.get("/company").then((r) => r.data), {} as Company),
  update: async (data: Partial<Company>) => unwrap<Company>(await api.put("/company", data).then((r) => r.data), {} as Company),
};

/* ================= ANALYTICS ================= */

export type AnalyticsSource = "reports" | "dashboard";

type SalesByPeriodPoint = {
  period: string;
  revenue: number;
  count: number;
};

type ProfitByPeriodPoint = {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  count: number;
};

type TopProductPoint = {
  product: string;
  total: number;
  count: number;
};

type SalesByUserPoint = {
  user: string;
  total: number;
  count: number;
};

const buildBase = (source: AnalyticsSource = "dashboard") => `/${source}`;

const requestArray = async <T>(url: string, params?: unknown): Promise<T[]> => {
  const payload = await api.get(url, { params }).then((r) => r.data);
  return unwrapArray<T>(payload);
};

const normalizeSalesByPeriod = (rows: unknown[]): SalesByPeriodPoint[] =>
  rows.map((row) => {
    const source = (row || {}) as Record<string, unknown>;
    return {
      period: String(source.period || source.date || source.label || ""),
      revenue: firstDefinedNumber(source, ["revenue", "total", "totalValue", "amount"]),
      count: firstDefinedNumber(source, ["count", "orders", "sales"]) || 0,
    };
  });

const normalizeProfitByPeriod = (rows: unknown[]): ProfitByPeriodPoint[] =>
  rows.map((row) => {
    const source = (row || {}) as Record<string, unknown>;
    const revenue = firstDefinedNumber(source, ["revenue", "totalRevenue", "total"]);
    const cost = firstDefinedNumber(source, ["cost", "totalCost"]);
    const profit = firstDefinedNumber(source, ["profit", "net"]) || revenue - cost;
    return {
      period: String(source.period || source.date || source.label || ""),
      revenue,
      cost,
      profit,
      count: firstDefinedNumber(source, ["count", "orders", "sales"]),
    };
  });

const normalizeTopProducts = (rows: unknown[]): TopProductPoint[] =>
  rows.map((row) => {
    const source = (row || {}) as Record<string, unknown>;
    return {
      product: String(source.product || source.name || source.sku || "Sem nome"),
      total: firstDefinedNumber(source, ["total", "revenue", "totalValue", "amount"]),
      count: firstDefinedNumber(source, ["count", "quantity", "qty", "sales"]),
    };
  });

const normalizeSalesByUser = (rows: unknown[]): SalesByUserPoint[] =>
  rows.map((row) => {
    const source = (row || {}) as Record<string, unknown>;
    return {
      user: String(source.user || source.seller || source.name || "Sem vendedor"),
      total: firstDefinedNumber(source, ["total", "revenue", "totalValue", "amount"]),
      count: firstDefinedNumber(source, ["count", "sales", "orders"]),
    };
  });

const normalizeStockLow = (rows: unknown[]) =>
  rows.map((row) => {
    const source = (row || {}) as Record<string, unknown>;
    return {
      _id: String(source._id || source.id || ""),
      name: String(source.name || source.product || "Sem produto"),
      quantity: n(source.quantity),
      minStock: n(source.minStock),
    };
  });

export const analyticsService = {
  summary: async (start?: string, end?: string) => {
    const payload = await api.get("/dashboard/summary", { params: { startDate: start, endDate: end } }).then((r) => r.data);
    return unwrap<Record<string, unknown>>(payload, {});
  },

  salesByPeriod: async (start: string, end: string) => {
    const rows = await requestArray<unknown>(`/dashboard/sales-by-period`, { startDate: start, endDate: end });
    return normalizeSalesByPeriod(rows);
  },

  salesByProduct: async (start?: string, end?: string, limit = 5, source: AnalyticsSource = "dashboard") => {
    const rows = await requestArray<unknown>(`${buildBase(source)}/top-products`, { startDate: start, endDate: end, limit });
    return normalizeTopProducts(rows);
  },

  stockLow: async (source: AnalyticsSource = "dashboard") => {
    const rows = await requestArray<unknown>(`${buildBase(source)}/alerts`);
    return normalizeStockLow(rows);
  },

  salesByUser: async (source: AnalyticsSource = "reports") => {
    const rows = await requestArray<unknown>(`${buildBase(source)}/sales-by-user`);
    return normalizeSalesByUser(rows);
  },

  stockLowCount: async () => {
    const payload = await api.get("/products/low-stock/count").then((r) => r.data);
    const data = unwrap<Record<string, unknown>>(payload, {});
    return {
      count: firstDefinedNumber(data, ["count", "total", "items"]) || 0,
    };
  },

  profitByPeriod: async (start?: string, end?: string, source: AnalyticsSource = "dashboard") => {
    const rows = await requestArray<unknown>(`${buildBase(source)}/profit-by-period`, { startDate: start, endDate: end });
    return normalizeProfitByPeriod(rows);
  },
};

export const reportService = analyticsService;
