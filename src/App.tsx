import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";
import { AppLayout } from "@/components/AppLayout";
import { PERMISSIONS } from "@/constants/permissions";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import CustomersPage from "@/pages/CustomersPage";
import SuppliersPage from "@/pages/SuppliersPage";
import CategoriesPage from "@/pages/CategoriesPage";
import ProductsPage from "@/pages/ProductsPage";
import SalesPage from "@/pages/SalesPage";
import SalesAnalyticsPage from "@/pages/SalesAnalyticsPage";
import StockMovementsPage from "@/pages/StockMovementsPage";
import OrdersPage from "@/pages/OrdersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import FinanceiroPage from "@/pages/FinanceiroPage";
import CompanySettingsPage from "@/pages/CompanySettingsPage";
import IntegrationSettingsPage from "@/pages/IntegrationSettingsPage";
import BudgetsPage from "@/pages/BudgetsPage";
import PricingCalculatorPage from "@/pages/PricingCalculatorPage";
import CashFlowPage from "@/pages/CashFlowPage";
import CrmPage from "@/pages/CrmPage";
import InventoryPage from "@/pages/InventoryPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const guarded = (Component: React.ComponentType, requiredPermissions: string[] = []) => (
  <RoleGuard requiredPermissions={requiredPermissions}><Component /></RoleGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PermissionProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={guarded(DashboardPage, [PERMISSIONS.DASHBOARD_VIEW])} />
                <Route path="/customers" element={guarded(CustomersPage, [PERMISSIONS.CUSTOMERS_VIEW])} />
                <Route path="/suppliers" element={guarded(SuppliersPage, [PERMISSIONS.CUSTOMERS_VIEW])} />
                <Route path="/categories" element={guarded(CategoriesPage, [PERMISSIONS.CATEGORIES_VIEW])} />
                <Route path="/products" element={guarded(ProductsPage, [PERMISSIONS.PRODUCTS_VIEW])} />
                <Route path="/sales" element={guarded(SalesPage, [PERMISSIONS.SALES_VIEW])} />
                <Route path="/sales/analytics" element={guarded(SalesAnalyticsPage, [PERMISSIONS.SALES_VIEW])} />
                <Route path="/stock/movements" element={guarded(StockMovementsPage, [PERMISSIONS.INVENTORY_VIEW])} />
                <Route path="/orders" element={guarded(OrdersPage, [PERMISSIONS.ORDERS_VIEW])} />
                <Route path="/payments" element={guarded(PaymentsPage, [PERMISSIONS.PAYMENTS_VIEW])} />
                <Route path="/financeiro" element={guarded(FinanceiroPage, [PERMISSIONS.PAYMENTS_VIEW])} />
                <Route path="/budgets" element={guarded(BudgetsPage, [PERMISSIONS.ORDERS_VIEW])} />
                <Route path="/pricing" element={guarded(PricingCalculatorPage, [PERMISSIONS.SALES_VIEW])} />
                <Route path="/cashflow" element={guarded(CashFlowPage, [PERMISSIONS.PAYMENTS_VIEW])} />
                <Route path="/crm" element={guarded(CrmPage, [PERMISSIONS.CUSTOMERS_VIEW])} />
                <Route path="/inventory" element={guarded(InventoryPage, [PERMISSIONS.INVENTORY_VIEW])} />
                <Route path="/users" element={guarded(UsersPage, [PERMISSIONS.USERS_VIEW])} />
                <Route path="/settings/company" element={guarded(CompanySettingsPage, [PERMISSIONS.COMPANY_SETTINGS])} />
                <Route path="/settings/integrations" element={guarded(IntegrationSettingsPage, [PERMISSIONS.COMPANY_SETTINGS])} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
