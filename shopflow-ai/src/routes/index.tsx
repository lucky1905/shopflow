import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom';
import { AUTH_ONLY_PATHS, ROUTES } from '@/constants';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';
import { LoadingPage } from '@/pages/LoadingPage';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const POSPage = lazy(() => import('@/pages/POSPage'));
const CustomersPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.CustomersPage })));
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage'));
// Sales module (Phase 4)
const SalesDashboardPage = lazy(() => import('@/pages/SalesPages').then((module) => ({ default: module.SalesDashboardPage })));
const SalesHistoryPage = lazy(() => import('@/pages/SalesPages').then((module) => ({ default: module.SalesHistoryPage })));
const SalesReturnsPage = lazy(() => import('@/pages/SalesPages').then((module) => ({ default: module.SalesReturnsPage })));
const SalesAnalyticsPage = lazy(() => import('@/pages/SalesPages').then((module) => ({ default: module.SalesAnalyticsPage })));
const InvoiceDetailsPage = lazy(() => import('@/pages/SalesPages').then((module) => ({ default: module.InvoiceDetailsPage })));
// Purchases module (Phase 4)
const PurchasesDashboardPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.PurchasesDashboardPage })));
const PurchaseOrdersPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.PurchaseOrdersPage })));
const SupplierOrdersPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.SupplierOrdersPage })));
const GoodsReceivedNotesPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.GoodsReceivedNotesPage })));
const PurchaseHistoryPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.PurchaseHistoryPage })));
const PendingDeliveriesPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.PendingDeliveriesPage })));
const SupplierPaymentsPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.SupplierPaymentsPage })));
const PurchaseOrderDetailsPage = lazy(() => import('@/pages/PurchasesPages').then((module) => ({ default: module.PurchaseOrderDetailsPage })));
// Reports & Analytics module (Phase 5)
const ReportsDashboardPage = lazy(() => import('@/features/reports/pages/ReportsDashboardPage'));
const RevenueAnalyticsPage = lazy(() => import('@/features/reports/pages/RevenueAnalyticsPage'));
const SalesReportsPage = lazy(() => import('@/features/reports/pages/SalesReportsPage'));
const PurchasesReportPage = lazy(() => import('@/features/reports/pages/PurchasesReportPage'));
const InventoryReportPage = lazy(() => import('@/features/reports/pages/InventoryReportPage'));
const CustomerReportPage = lazy(() => import('@/features/reports/pages/CustomerReportPage'));
const SupplierReportPage = lazy(() => import('@/features/reports/pages/SupplierReportPage'));
const ProfitLossReportPage = lazy(() => import('@/features/reports/pages/ProfitLossReportPage'));
const TaxReportPage = lazy(() => import('@/features/reports/pages/TaxReportPage'));

const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
// Analytics module (Phase 5)
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsDashboardPage'));
// AI Insights & Forecasting module (Phase 6)
const AIInsightsPage = lazy(() => import('@/features/ai/pages/AIDashboardPage'));
const SettingsPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.SettingsPage })));
const HelpPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.HelpPage })));
const ProfilePage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.ProfilePage })));
const NotFoundPage = lazy(() => import('@/pages/ErrorPages').then((module) => ({ default: module.NotFoundPage })));
const UnauthorizedPage = lazy(() => import('@/pages/ErrorPages').then((module) => ({ default: module.UnauthorizedPage })));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'));

/** Suspense boundary shared by every lazy route so loading looks identical. */
function LazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
}

/** Redirects signed-in users away from login/register (honours ?redirect=). */
function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const location = useLocation();

  if (isLoading) return <LoadingPage />;
  if (isAuthenticated && AUTH_ONLY_PATHS.includes(location.pathname)) {
    const params = new URLSearchParams(location.search);
    return <Navigate to={params.get('redirect') ?? ROUTES.DASHBOARD} replace />;
  }
  return <>{children}</>;
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const location = useLocation();

  if (isLoading) return <LoadingPage />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

/**
 * Role gate for admin-only areas.
 *
 * `admin` and `owner` can reach everything; `manager` and `cashier` are
 * redirected to the dashboard with an explanation rather than shown a blank
 * screen. Must be rendered inside `RequireAuth`.
 */
function RequireRole({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  // `staff` is the app's cashier role (the backend calls it "cashier").
  const role: UserRole = user?.role ?? 'staff';

  if (!allow.includes(role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace state={{ denied: true }} />;
  }
  return <>{children}</>;
}

/** Areas only admins and managers may open. Cashiers are redirected away. */
const MANAGER_ROLES: UserRole[] = ['owner', 'admin', 'manager'];

export const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <LazyRoute component={LandingPage} /> },
  {
    path: ROUTES.LOGIN,
    element: (
      <GuestRoute>
        <LazyRoute component={LoginPage} />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.REGISTER,
    element: (
      <GuestRoute>
        <LazyRoute component={RegisterPage} />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: (
      <GuestRoute>
        <LazyRoute component={ForgotPasswordPage} />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: (
      <GuestRoute>
        <LazyRoute component={ResetPasswordPage} />
      </GuestRoute>
    ),
  },
  { path: ROUTES.UNAUTHORIZED, element: <LazyRoute component={UnauthorizedPage} /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: (
          <Suspense fallback={<LoadingPage />}>
            <DashboardLayout />
          </Suspense>
        ),
        children: [
          { path: ROUTES.DASHBOARD, element: <LazyRoute component={DashboardPage} /> },
          { path: ROUTES.INVENTORY, element: <LazyRoute component={InventoryPage} /> },
          { path: ROUTES.POS, element: <LazyRoute component={POSPage} /> },
          { path: ROUTES.CUSTOMERS, element: <LazyRoute component={CustomersPage} /> },
          {
            path: ROUTES.SUPPLIERS,
            element: (
              <RequireRole allow={MANAGER_ROLES}>
                <LazyRoute component={SuppliersPage} />
              </RequireRole>
            ),
          },
          { path: ROUTES.SALES, element: <LazyRoute component={SalesDashboardPage} /> },
          { path: ROUTES.SALES_HISTORY, element: <LazyRoute component={SalesHistoryPage} /> },
          { path: ROUTES.SALES_RETURNS, element: <LazyRoute component={SalesReturnsPage} /> },
          { path: ROUTES.SALES_ANALYTICS, element: <LazyRoute component={SalesAnalyticsPage} /> },
          { path: ROUTES.SALES_INVOICE, element: <LazyRoute component={InvoiceDetailsPage} /> },
          { path: ROUTES.PRODUCTS, element: <LazyRoute component={ProductsPage} /> },
          {
            path: ROUTES.CATEGORIES,
            element: (
              <RequireRole allow={MANAGER_ROLES}>
                <LazyRoute component={CategoriesPage} />
              </RequireRole>
            ),
          },
          { path: ROUTES.PURCHASES, element: <LazyRoute component={PurchasesDashboardPage} /> },
          { path: ROUTES.PURCHASE_ORDERS, element: <LazyRoute component={PurchaseOrdersPage} /> },
          { path: ROUTES.PURCHASE_SUPPLIER_ORDERS, element: <LazyRoute component={SupplierOrdersPage} /> },
          { path: ROUTES.PURCHASE_GRN, element: <LazyRoute component={GoodsReceivedNotesPage} /> },
          { path: ROUTES.PURCHASE_HISTORY, element: <LazyRoute component={PurchaseHistoryPage} /> },
          { path: ROUTES.PURCHASE_DELIVERIES, element: <LazyRoute component={PendingDeliveriesPage} /> },
          { path: ROUTES.PURCHASE_PAYMENTS, element: <LazyRoute component={SupplierPaymentsPage} /> },
          { path: ROUTES.PURCHASE_ORDER, element: <LazyRoute component={PurchaseOrderDetailsPage} /> },
          // Reports Module (Phase 5)
          { path: ROUTES.REPORTS, element: <LazyRoute component={ReportsDashboardPage} /> },
          { path: ROUTES.REPORTS_REVENUE, element: <LazyRoute component={RevenueAnalyticsPage} /> },
          { path: ROUTES.REPORTS_SALES, element: <LazyRoute component={SalesReportsPage} /> },
          { path: ROUTES.REPORTS_PURCHASES, element: <LazyRoute component={PurchasesReportPage} /> },
          { path: ROUTES.REPORTS_INVENTORY, element: <LazyRoute component={InventoryReportPage} /> },
          { path: ROUTES.REPORTS_CUSTOMERS, element: <LazyRoute component={CustomerReportPage} /> },
          { path: ROUTES.REPORTS_SUPPLIERS, element: <LazyRoute component={SupplierReportPage} /> },
          { path: ROUTES.REPORTS_PROFIT_LOSS, element: <LazyRoute component={ProfitLossReportPage} /> },
          { path: ROUTES.REPORTS_TAX, element: <LazyRoute component={TaxReportPage} /> },
          { path: ROUTES.ANALYTICS, element: <LazyRoute component={AnalyticsPage} /> },
          { path: ROUTES.AI_INSIGHTS, element: <LazyRoute component={AIInsightsPage} /> },
          {
            path: ROUTES.SETTINGS,
            element: (
              <RequireRole allow={MANAGER_ROLES}>
                <LazyRoute component={SettingsPage} />
              </RequireRole>
            ),
          },
          { path: ROUTES.HELP, element: <LazyRoute component={HelpPage} /> },
          { path: ROUTES.PROFILE, element: <LazyRoute component={ProfilePage} /> },
        ],
      },
    ],
  },
  { path: '*', element: <LazyRoute component={NotFoundPage} /> },
]);

export default router;

