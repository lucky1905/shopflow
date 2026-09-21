import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
);

const NotFoundPage = lazy(() => import("@/pages/ErrorPages"));
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", element: <ProtectedRoute><DashboardLayout><div className="p-6">Dashboard</div></DashboardLayout></ProtectedRoute> },
  { path: "*", element: <NotFoundPage /> },
]);

