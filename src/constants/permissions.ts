export const PERMISSIONS = {
  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  SALES_EDIT: "sales.edit",
  SALES_DELETE: "sales.delete",
  SALES_CONFIRM_PAYMENT: "sales.confirm_payment",

  ORDERS_VIEW: "orders.view",
  ORDERS_CREATE: "orders.create",
  ORDERS_UPDATE_STATUS: "orders.update_status",
  ORDERS_SEND: "orders.send",

  PRODUCTS_VIEW: "products.view",
  PRODUCTS_MANAGE: "products.manage",
  PRODUCTS_CREATE: "products.manage",
  PRODUCTS_UPDATE: "products.manage",
  PRODUCTS_DELETE: "products.manage",

  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_MANAGE: "categories.manage",
  CATEGORIES_CREATE: "categories.manage",
  CATEGORIES_UPDATE: "categories.manage",
  CATEGORIES_DELETE: "categories.manage",

  DASHBOARD_VIEW: "dashboard.view",
  REPORTS_VIEW: "reports.view",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_MANAGE: "payments.manage",

  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",
  CUSTOMERS_CREATE: "customers.manage",
  CUSTOMERS_UPDATE: "customers.manage",
  CUSTOMERS_DELETE: "customers.manage",

  SUPPLIERS_VIEW: "products.view",
  SUPPLIERS_CREATE: "products.manage",
  SUPPLIERS_UPDATE: "products.manage",
  SUPPLIERS_DELETE: "products.manage",

  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  USERS_DELETE: "users.manage",
  COMPANY_SETTINGS: "company.settings",
  SYSTEM_ADMIN: "system.admin",

  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",
  INVENTORY_APPROVE: "inventory.approve",
} as const;
