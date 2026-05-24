import { createCrudService } from "./crudService";
import api from "./api";
import type {
  User, UserFormData,
  Category, CategoryFormData,
  Customer, CustomerFormData,
  Supplier, SupplierFormData,
  StockMovement, StockMovementFormData,
  Payment, PaymentFormData,
  Company, Quote,
} from "@/types";
import { extractData, extractList, handleApiError } from "@/utils/apiClient";
import type { ApiResponse } from "@/utils/apiClient";

export { authService } from "./authService";
export { orderService } from "./orderService";
export { saleService } from "./saleService";
export { productService } from "./productService";

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
    try {
      const response = await api.get<ApiResponse<Payment[]> | Payment[]>("/payments/pendents");
      return extractList<Payment>(response).items;
    } catch (error) {
      console.error("Erro ao buscar pagamentos pendentes:", error);
      throw new Error(handleApiError(error));
    }
  },
};

/* ================= BUDGET ================= */

export const budgetService = {
  getPage: async (page = 1, limit = 50) => {
    try {
      const response = await api.get<ApiResponse<Quote[]> | Quote[]>("/quotes", { params: { page, limit } });
      return extractList<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  getAll: async () => {
    const page = await budgetService.getPage(1, 50);
    return page.items;
  },
  getById: async (id: string) => {
    try {
      const response = await api.get<ApiResponse<Quote> | Quote>(`/quotes/${id}`);
      return extractData<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  create: async (data: unknown) => {
    try {
      const response = await api.post<ApiResponse<Quote> | Quote>("/quotes", data);
      return extractData<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  update: async (id: string, data: unknown) => {
    try {
      const response = await api.put<ApiResponse<Quote> | Quote>(`/quotes/${id}`, data);
      return extractData<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  delete: async (id: string) => {
    try {
      const response = await api.delete<ApiResponse<Quote> | Quote>(`/quotes/${id}`);
      return extractData<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  approve: async (id: string, data: unknown) => {
    try {
      const response = await api.put<ApiResponse<Quote> | Quote>(`/quotes/${id}/approve`, data);
      return extractData<Quote>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

/* ================= COMPANY ================= */

export const companyService = {
  get: async () => {
    try {
      const response = await api.get<ApiResponse<Company> | Company>("/company");
      return extractData<Company>(response);
    } catch (error) {
      console.warn("Erro ao buscar dados da empresa:", error);
      return {} as Company;
    }
  },
  update: async (data: Partial<Company>) => {
    try {
      const response = await api.put<ApiResponse<Company> | Company>("/company", data);
      return extractData<Company>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

/* ================= ANALYTICS ================= */

export type AnalyticsSource = "reports" | "dashboard";

export type SalesByPeriodPoint = {
  period: string;
  revenue: number;
  count: number;
};

export type ProfitByPeriodPoint = {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  count: number;
};

export type TopProductPoint = {
  product: string;
  total: number;
  count: number;
};

export type SalesByUserPoint = {
  user: string;
  total: number;
  count: number;
};

export type SalesProjections = {
  projectedAnnualRevenue: number;
  totalSold: number;
  monthlyGoal: number;
  breakEvenPoint: number;
  monthlySales: { month: string; revenue: number; }[];
  dailyGoalPercentage: number;
  annualGoalAchievedPercentage: number;
  totalSalesThisMonth: number;
};

const buildBase = (source: AnalyticsSource = "dashboard") => `/${source}`;

const requestArray = async <T>(url: string, params?: unknown): Promise<T[]> => {
  const response = await api.get<ApiResponse<T[]> | T[]>(url, { params });
  return extractList<T>(response).items;
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
    try {
      const response = await api.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>("/dashboard/summary", { params: { startDate: start, endDate: end } });
      return extractData<Record<string, unknown>>(response);
    } catch (error) {
      console.warn("Erro ao buscar sumario:", error);
      return {};
    }
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
    const response = await api.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>("/products/low-stock/count");
    const data = extractData<Record<string, unknown>>(response);
    return {
      count: firstDefinedNumber(data, ["count", "total", "items"]) || 0,
    };
  },
  profitByPeriod: async (start?: string, end?: string, source: AnalyticsSource = "dashboard") => {
    const rows = await requestArray<unknown>(`${buildBase(source)}/profit-by-period`, { startDate: start, endDate: end });
    return normalizeProfitByPeriod(rows);
  },

  getSalesProjections: async (source: AnalyticsSource = "dashboard") => {
    try {
      const response = await api.get<ApiResponse<SalesProjections> | SalesProjections>(`${buildBase(source)}/sales-projections`);
      return extractData<SalesProjections>(response);
    } catch (error) {
      console.warn("Erro ao buscar projecoes:", error);
      return {} as SalesProjections;
    }
  },
};

export const reportService = analyticsService;
