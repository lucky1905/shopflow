import {
  MOCK_CATEGORY_BREAKDOWN,
  MOCK_CUSTOMER_PERFORMANCE,
  MOCK_CUSTOMER_SEGMENTS,
  MOCK_INVENTORY_MOVEMENTS,
  MOCK_INVENTORY_VALUATION,
  MOCK_OVERVIEW_MONTHLY,
  MOCK_PROFIT_AND_LOSS,
  MOCK_PURCHASE_REPORT,
  MOCK_PURCHASE_SPEND_BY_CAT,
  MOCK_REPORTS_OVERVIEW,
  MOCK_REVENUE_BY_CHANNEL,
  MOCK_REVENUE_BY_PAYMENT,
  MOCK_REVENUE_TREND,
  MOCK_SALES_REPORT,
  MOCK_SUPPLIER_PERFORMANCE,
  MOCK_TAX_SUMMARY,
  MOCK_TOP_SELLING_ITEMS,
} from './reports.mock';
import type {
  CategoryBreakdownPoint,
  CustomerPerformanceRow,
  CustomerSegmentPoint,
  InventoryMovementSummaryPoint,
  InventoryValuationRow,
  OverviewMonthlyPerformance,
  ProfitAndLossBreakdown,
  PurchaseReportRow,
  PurchaseSpendByCategoryPoint,
  ReportsFilterParams,
  ReportsOverviewSummary,
  RevenueByChannelPoint,
  RevenueByPaymentMethodPoint,
  RevenueTrendPoint,
  SalesReportRow,
  SupplierPerformanceRow,
  TaxFilingSummary,
  TopSellingItemRow,
} from '../types';

/** Simulates network latency (80–180ms) for realistic UX and loading states. */
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportsService = {
  getOverview: async (_params?: ReportsFilterParams): Promise<ReportsOverviewSummary> => {
    await delay();
    return { ...MOCK_REPORTS_OVERVIEW };
  },

  getMonthlyPerformance: async (_params?: ReportsFilterParams): Promise<OverviewMonthlyPerformance[]> => {
    await delay();
    return [...MOCK_OVERVIEW_MONTHLY];
  },

  getCategoryBreakdown: async (_params?: ReportsFilterParams): Promise<CategoryBreakdownPoint[]> => {
    await delay();
    return [...MOCK_CATEGORY_BREAKDOWN];
  },

  getRevenueAnalytics: async (_params?: ReportsFilterParams): Promise<{
    trend: RevenueTrendPoint[];
    channels: RevenueByChannelPoint[];
    paymentMethods: RevenueByPaymentMethodPoint[];
  }> => {
    await delay();
    return {
      trend: [...MOCK_REVENUE_TREND],
      channels: [...MOCK_REVENUE_BY_CHANNEL],
      paymentMethods: [...MOCK_REVENUE_BY_PAYMENT],
    };
  },

  getSalesReport: async (
    params?: ReportsFilterParams,
  ): Promise<{
    orders: SalesReportRow[];
    topProducts: TopSellingItemRow[];
  }> => {
    await delay();
    let orders = [...MOCK_SALES_REPORT];
    if (params?.channel && params.channel !== 'all') {
      orders = orders.filter((o) => o.channel === params.channel);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.paymentMethod.toLowerCase().includes(q),
      );
    }
    return {
      orders,
      topProducts: [...MOCK_TOP_SELLING_ITEMS],
    };
  },

  getPurchaseReport: async (
    params?: ReportsFilterParams,
  ): Promise<{
    orders: PurchaseReportRow[];
    categorySpend: PurchaseSpendByCategoryPoint[];
  }> => {
    await delay();
    let orders = [...MOCK_PURCHASE_REPORT];
    if (params?.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o) => o.poNumber.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q),
      );
    }
    return {
      orders,
      categorySpend: [...MOCK_PURCHASE_SPEND_BY_CAT],
    };
  },

  getInventoryReport: async (
    params?: ReportsFilterParams,
  ): Promise<{
    valuation: InventoryValuationRow[];
    movements: InventoryMovementSummaryPoint[];
  }> => {
    await delay();
    let valuation = [...MOCK_INVENTORY_VALUATION];
    if (params?.category && params.category !== 'all') {
      valuation = valuation.filter((i) => i.category === params.category);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      valuation = valuation.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      );
    }
    return {
      valuation,
      movements: [...MOCK_INVENTORY_MOVEMENTS],
    };
  },

  getCustomerReport: async (
    params?: ReportsFilterParams,
  ): Promise<{
    customers: CustomerPerformanceRow[];
    segments: CustomerSegmentPoint[];
  }> => {
    await delay();
    let customers = [...MOCK_CUSTOMER_PERFORMANCE];
    if (params?.search) {
      const q = params.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q),
      );
    }
    return {
      customers,
      segments: [...MOCK_CUSTOMER_SEGMENTS],
    };
  },

  getSupplierReport: async (
    params?: ReportsFilterParams,
  ): Promise<{
    suppliers: SupplierPerformanceRow[];
  }> => {
    await delay();
    let suppliers = [...MOCK_SUPPLIER_PERFORMANCE];
    if (params?.search) {
      const q = params.search.toLowerCase();
      suppliers = suppliers.filter(
        (s) => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q),
      );
    }
    return { suppliers };
  },

  getProfitAndLoss: async (_params?: ReportsFilterParams): Promise<ProfitAndLossBreakdown> => {
    await delay();
    return { ...MOCK_PROFIT_AND_LOSS };
  },

  getTaxSummary: async (_params?: ReportsFilterParams): Promise<TaxFilingSummary> => {
    await delay();
    return { ...MOCK_TAX_SUMMARY };
  },
};
