import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";
import { AppLayout } from "@/components/AppLayout";
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
import CompanySettingsPage from "@/pages/CompanySettingsPage";
import BudgetsPage from "@/pages/BudgetsPage";
import PricingCalculatorPage from "@/pages/PricingCalculatorPage";
import CashFlowPage from "@/pages/CashFlowPage";
import CrmPage from "@/pages/CrmPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Wrap each route with RoleGuard (it auto-checks permissions by path)
const guarded = (Component: React.ComponentType) => (
  <RoleGuard><Component /></RoleGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={guarded(DashboardPage)} />
              <Route path="/customers" element={guarded(CustomersPage)} />
              <Route path="/suppliers" element={guarded(SuppliersPage)} />
              <Route path="/categories" element={guarded(CategoriesPage)} />
              <Route path="/products" element={guarded(ProductsPage)} />
              <Route path="/sales" element={guarded(SalesPage)} />
              <Route path="/sales/analytics" element={guarded(SalesAnalyticsPage)} />
              <Route path="/stock/movements" element={guarded(StockMovementsPage)} />
              <Route path="/orders" element={guarded(OrdersPage)} />
              <Route path="/payments" element={guarded(PaymentsPage)} />
              <Route path="/budgets" element={guarded(BudgetsPage)} />
              <Route path="/pricing" element={guarded(PricingCalculatorPage)} />
              <Route path="/cashflow" element={guarded(CashFlowPage)} />
              <Route path="/crm" element={guarded(CrmPage)} />
              <Route path="/users" element={guarded(UsersPage)} />
              <Route path="/settings/company" element={guarded(CompanySettingsPage)} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
