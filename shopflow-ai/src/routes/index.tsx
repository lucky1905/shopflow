import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom';
import { AUTH_ONLY_PATHS, ROUTES } from '@/constants';
import { useAuthStore } from '@/store';
import { LoadingPage } from '@/pages/LoadingPage';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.InventoryPage })));
const POSPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.POSPage })));
const CustomersPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.CustomersPage })));
const SuppliersPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.SuppliersPage })));
const SalesPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.SalesPage })));
const ProductsPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.ProductsPage })));
const CategoriesPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.CategoriesPage })));
const PurchasesPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.PurchasesPage })));
const ReportsPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.ReportsPage })));
const AnalyticsPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.AnalyticsPage })));
const AIInsightsPage = lazy(() => import('@/pages/ModulePages').then((module) => ({ default: module.AIInsightsPage })));
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
          { path: ROUTES.SUPPLIERS, element: <LazyRoute component={SuppliersPage} /> },
          { path: ROUTES.SALES, element: <LazyRoute component={SalesPage} /> },
          { path: ROUTES.PRODUCTS, element: <LazyRoute component={ProductsPage} /> },
          { path: ROUTES.CATEGORIES, element: <LazyRoute component={CategoriesPage} /> },
          { path: ROUTES.PURCHASES, element: <LazyRoute component={PurchasesPage} /> },
          { path: ROUTES.REPORTS, element: <LazyRoute component={ReportsPage} /> },
          { path: ROUTES.ANALYTICS, element: <LazyRoute component={AnalyticsPage} /> },
          { path: ROUTES.AI_INSIGHTS, element: <LazyRoute component={AIInsightsPage} /> },
          { path: ROUTES.SETTINGS, element: <LazyRoute component={SettingsPage} /> },
          { path: ROUTES.HELP, element: <LazyRoute component={HelpPage} /> },
          { path: ROUTES.PROFILE, element: <LazyRoute component={ProfilePage} /> },
        ],
      },
    ],
  },
  { path: '*', element: <LazyRoute component={NotFoundPage} /> },
]);

export default router;
