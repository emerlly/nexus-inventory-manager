export const PERMISSIONS = {
  // Vendas
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  SALES_CONFIRM_PAYMENT: 'sales.confirm_payment',

  // Pedidos
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE_STATUS: 'orders.update_status',
  ORDERS_SEND: 'orders.send',

  // Produtos e Categorias
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',

  // Financeiro e Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_MANAGE: 'payments.manage',

  // Clientes
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',

  // Configurações e Usuários
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  COMPANY_SETTINGS: 'company.settings',
  SYSTEM_ADMIN: 'system.admin',

  // Inventário
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_APPROVE: 'inventory.approve'
} as const;