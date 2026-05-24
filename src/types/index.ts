// ===== Shared =====
export interface Address {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
}

export type UserRole =
  | "root"
  | "admin"
  | "manager"
  | "operator"
  | "seller"
  | "customer"
  | "stockist"
  | "gerente"
  | "vendedor"
  | "estoquista"
  | "operador"
  | "cliente"
  | "dev";

// ===== Auth =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  permissions?: string[];
  allowedRoutes?: string[];
}

export interface RegisterRequest extends UserFormData {}

// ===== User =====
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  role: UserRole;
  companyId?: string;
  company?: string;
  active?: boolean;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MeResponse {
  user: User;
  permissions?: string[];
  allowedRoutes?: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  cpf?: string;
  companyId?: string;
  active?: boolean;
  address?: string;
}

// ===== Product =====
export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  SKU?: string;
  images?: ProductImage[];
  category: Category | string;
  supplier: Supplier | string;
  companyId?: string;
  costPrice: number;
  salePrice: number;
  stock: {
    physical: number;
    reserved?: number;
  };
  minStock?: number;
  active?: boolean;
  attributes?: ProductAttribute[];
  availableStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  SKU?: string;
  salePrice: number;
  costPrice?: number;
  stock: {
    physical: number;
  };
  minStock?: number;
  categoryId: string;
  supplierId: string;
  attributes?: ProductAttribute[];
}

// ===== Category =====
export interface Category {
  _id: string;
  name: string;
  description?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  prefix?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  prefix?: string;
  active?: boolean;
}

// ===== Customer =====
export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  cpf?: string;
  active: boolean;
  password?: string;
  company?: string;
  companyId?: string;
  role?: string;
  document: string;
  documentType: "CPF" | "CNPJ";
  address: Address;
}

export type CustomerFormData = {
  active: boolean;
  name: string;
  email?: string;
  phone?: string;
  documentType: "CPF" | "CNPJ";
  document: string;
  address: Address;
};

// ===== Supplier =====
export interface Supplier {
  _id: string;
  name: string;
  email?: string;
  documentType: "CPF" | "CNPJ";
  document: string;
  address: Address;
  phone?: string;
  active: boolean;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  address: Address;
  active: boolean;
  documentType: "CPF" | "CNPJ";
  document: string;
}

// ===== Stock Movement =====
export interface StockMovement {
  _id: string;
  product: Product | string;
  productId?: string;
  type: "entry" | "exit" | "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  user?: User | string;
  createdAt?: string;
  updatedAt?: string;
  order?: string;
}

export interface StockMovementFormData {
  product?: string;
  productId?: string;
  type: "entry" | "exit" | "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
}

// ===== Sale =====
export interface SaleItem {
  product: Product | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  _id: string;
  customer?: Customer | string;
  items: SaleItem[];
  totalValue: number;
  user?: User | string;
  createdAt?: string;
  updatedAt?: string;
  seller?: seller | string;
  paymentMethod?: string;
  status?: string;
}

export interface SaleFormData {
  customer?: string;
  paymentMethod: string;
  paymentCondition: string;
  dueDate?: string | Date | null;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// ===== Quote/Budget =====
export type QuoteStatus = "Rascunho" | "Pendente" | "Aprovado" | "Convertido" | "Cancelado";

export interface QuoteItem {
  product: Product | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  _id: string;
  customer: Customer | string;
  items: QuoteItem[];
  totalValue: number;
  status: QuoteStatus;
  createdBy?: User | string;
  validUntil?: string;
  sale?: Sale | string;
  convertedToSale?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
export type OrderStatus =
  | "Pendente"
  | "Reservado"
  | "Separando"
  | "Faturado"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export interface Order {
  _id: string;
  customer?: Customer | string;
  items: SaleItem[];
  totalValue: number;
  status: OrderStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  user?: User | string;
  seller?: seller | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderFormData {
  customer?: string;
  items: { product: string; quantity: number; unitPrice: number }[];
  paymentMethod: string;
  status?: OrderStatus;
}

// ===== Payment =====
export type PaymentStatus = "Pendente" | "Processando" | "Pago" | "Falhou" | "Cancelado" | "Espirado" | "Atrasado";
export type PaymentType = "Receita" | "Despesa";

export interface Payment {
  _id: string;
  description?: string;
  type?: PaymentType;
  amount: number;
  status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  dueDate?: string;
  method?: string;
  paidAt?: string;
  customer?: Customer | string;
  supplier?: Supplier | string;
  sale?: Sale | string;
  order?: Order | string;
  user?: User | string;
  createdAt?: string;
  updatedAt?: string;
  totalValue?: number;
  name?: string;
}

export interface PaymentFormData {
  description?: string;
  type?: PaymentType;
  amount: number;
  status?: PaymentStatus;
  dueDate?: string;
  customer?: string;
  supplier?: string;
  saleId?: string;
  method?: string;
}

// ===== Company =====
export interface Company {
  _id: string;
  companyName?: string;
  name?: string;
  document?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
  updatedAt?: string;
  paymentLink?: string;
  paymentToken?: string;
  webhookUrl?: string;
  apiKey?: string;
  plan?: string;
  status?: string;
  monthlyGoal?: number;
  annualGoal?: number;
  breakEvenPoint?: number;
}

export interface Reports {
  salesByPeriod: SalesByPeriod[];
  salesByProduct: SalesByProduct[];
  salesByUser: SalesByUser[];
  profitByPeriod: ProfitByPeriod[];
  stockLow: StockLow[];
}
