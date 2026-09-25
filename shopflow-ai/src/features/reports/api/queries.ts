import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { reportsService } from './reports.service';
import type { ReportsFilterParams } from '../types';

export function useReportsOverview(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.summary(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getOverview(params),
  });
}

export function useMonthlyPerformance(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: [...queryKeys.reports.all, 'monthly', params] as const,
    queryFn: () => reportsService.getMonthlyPerformance(params),
  });
}

export function useCategoryBreakdown(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: [...queryKeys.reports.all, 'categories', params] as const,
    queryFn: () => reportsService.getCategoryBreakdown(params),
  });
}

export function useRevenueAnalytics(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.revenue(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getRevenueAnalytics(params),
  });
}

export function useSalesReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.sales(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getSalesReport(params),
  });
}

export function usePurchaseReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.purchases(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getPurchaseReport(params),
  });
}

export function useInventoryReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.inventory(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getInventoryReport(params),
  });
}

export function useCustomerReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.customers(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getCustomerReport(params),
  });
}

export function useSupplierReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.suppliers(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getSupplierReport(params),
  });
}

export function useProfitLossReport(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.profitLoss(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getProfitAndLoss(params),
  });
}

export function useTaxSummary(params?: ReportsFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.tax(params as unknown as Record<string, unknown>),
    queryFn: () => reportsService.getTaxSummary(params),
  });
}
