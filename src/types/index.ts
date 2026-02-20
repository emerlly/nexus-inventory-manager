// ===== Auth =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ===== User =====
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  companyName?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
}

// ===== Product =====
export interface Product {
  _id: string;
  name: string;
  description?: string;
  SKU?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  minStock?: number;
  category?: Category;
  supplier?: Supplier;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  minStock?: number;
  category?: string;
  supplier?: string;
}

// ===== Category =====
export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  active?: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

// ===== Customer =====
export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ===== Supplier =====
export interface Supplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}
export interface seller {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  role: string;
}

export interface SupplierFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ===== Stock Movement =====
export interface StockMovement {
  _id: string;
  product: Product | string;
  type: "entry" | "exit";
  quantity: number;
  reason?: string;
  user?: User | string;
  createdAt?: string;
}

export interface StockMovementFormData {
  product: string;
  type: "entry" | "exit";
  quantity: number;
  reason?: string;
}

// ===== Sale =====
export interface SaleItem {
  product: Product | string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  _id: string;
  customer?: Customer | string;
  items: SaleItem[];
  totalValue: number;
  user?: User | string;
  createdAt?: string;
  seller?: seller | string;
}

export interface SaleFormData {
  customer?: string;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// ===== Reports =====
export interface SalesByPeriod {
  period: string;
  total: number;
  count: number;
}

export interface SalesByProduct {
  product: string;
  total: number;
  count: number;
}

export interface SalesByUser {
  user: string;
  total: number;
  count: number;
}

export interface ProfitByPeriod {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
}

export interface StockLow {
  _id: string;
  name: string;
  quantity: number;
  minStock: number;
}

// ===== Order =====
export type OrderStatus = "pendente" | "separando" | "produzindo" | "enviado" | "entregue";

export interface Order {
  _id: string;
  customer?: Customer | string;
  items: SaleItem[];
  totalOrder: number;
  status: OrderStatus;
  user?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderFormData {
  customer?: string;
  items: { product: string; quantity: number; unitPrice: number }[];
  status?: OrderStatus;
}

// ===== Payment =====
export type PaymentStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type PaymentType = "receita" | "despesa";

export interface Payment {
  _id: string;
  description: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  customer?: Customer | string;
  supplier?: Supplier | string;
  sale?: Sale | string;
  user?: User | string;
  createdAt?: string;
}

export interface PaymentFormData {
  description: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  customer?: string;
  supplier?: string;
}

// ===== Company =====
export interface Company {
  _id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  updatedAt?: string;
}

export interface Reports {
  salesByPeriod: SalesByPeriod[];
  salesByProduct: SalesByProduct[];
  salesByUser: SalesByUser[];
  profitByPeriod: ProfitByPeriod[];
  stockLow: StockLow[];
}