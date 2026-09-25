// Reports domain contracts (Phase 5)
export type ReportsDatePreset = 'today' | '7d' | '30d' | '90d' | '12m' | 'custom';

export type ReportCategory =
  | 'overview'
  | 'revenue'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'profit_loss'
  | 'tax';

export interface ReportsFilterParams {
  preset: ReportsDatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  storeId?: string;
  channel?: 'all' | 'pos' | 'online' | 'wholesale';
  category?: string;
  search?: string;
}

export interface MetricCardData {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  isCurrency?: boolean;
  description?: string;
}

export interface ReportsOverviewSummary {
  totalRevenue: number;
  totalOrders: number;
  totalPurchases: number;
  grossProfit: number;
  netMarginPct: number;
  totalTaxCollected: number;
  inventoryValuation: number;
  activeCustomerCount: number;
  revenueTrendPct: number;
  ordersTrendPct: number;
  profitTrendPct: number;
  taxTrendPct: number;
}

export interface OverviewMonthlyPerformance {
  month: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

export interface RevenueTrendPoint {
  date: string;
  label: string;
  grossRevenue: number;
  netRevenue: number;
  discounts: number;
  returns: number;
}

export interface RevenueByChannelPoint {
  channel: string;
  revenue: number;
  orders: number;
  sharePct: number;
  color: string;
}

export interface SalesReportRow {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  channel: 'pos' | 'online' | 'wholesale';
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
}

export interface TopSellingItemRow {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

export interface PurchaseReportRow {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  deliveryStatus: 'received' | 'in_transit' | 'pending';
}

export interface PurchaseSpendByCategoryPoint {
  category: string;
  spend: number;
  percentage: number;
  poCount: number;
  color: string;
}

export interface InventoryValuationRow {
  productId: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  retailPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  turnoverRatio: number;
  daysToStockout: number;
}

export interface InventoryMovementSummaryPoint {
  month: string;
  stockIn: number;
  stockOut: number;
  adjusted: number;
}

export interface CustomerPerformanceRow {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpend: number;
  averageOrderValue: number;
  lastOrderDate: string;
  customerSegment: 'vip' | 'regular' | 'new' | 'at_risk';
}

export interface CustomerSegmentPoint {
  segment: string;
  customerCount: number;
  totalSpend: number;
  sharePct: number;
  color: string;
}

export interface SupplierPerformanceRow {
  supplierId: string;
  name: string;
  contactPerson: string;
  ordersCount: number;
  totalSpend: number;
  outstandingBalance: number;
  onTimeDeliveryRatePct: number;
  qualityCompliancePct: number;
  averageLeadTimeDays: number;
  rating: number;
}

export interface ProfitAndLossBreakdown {
  period: string;
  grossSales: number;
  discountsAndAllowances: number;
  netSales: number;
  cogs: {
    beginningInventory: number;
    purchases: number;
    directLaborAndFreight: number;
    endingInventory: number;
    totalCogs: number;
  };
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: {
    rentAndUtilities: number;
    salariesAndWages: number;
    marketingAndAdvertising: number;
    softwareAndPosFees: number;
    shippingAndLogistics: number;
    miscellaneous: number;
    totalOperatingExpenses: number;
  };
  operatingIncome: number;
  depreciationAndTaxes: number;
  netProfit: number;
  netMarginPct: number;
}

export interface TaxSummaryRateRow {
  rateLabel: string;
  taxRatePct: number;
  taxableSalesAmount: number;
  cgstCollected: number;
  sgstCollected: number;
  igstCollected: number;
  totalTaxCollected: number;
  taxablePurchaseAmount: number;
  inputTaxCreditAvailable: number;
  netTaxPayable: number;
}

export interface TaxFilingSummary {
  period: string;
  totalTaxableSales: number;
  totalOutputTax: number;
  totalTaxablePurchases: number;
  totalInputTaxCredit: number;
  netGstPayable: number;
  filingDueDate: string;
  filingStatus: 'ready' | 'pending' | 'filed';
  breakdownByRate: TaxSummaryRateRow[];
}

export interface RevenueByPaymentMethodPoint {
  method: string;
  amount: number;
  transactionCount: number;
  sharePct: number;
  color: string;
}
