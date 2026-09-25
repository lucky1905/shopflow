export type InsightTone = 'positive' | 'warning' | 'danger' | 'neutral';
export type AIView = 'overview' | 'forecast' | 'customers' | 'products' | 'profit';
export type ForecastRange = '7D' | '30D' | '90D';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface AIInsightMeta {
  generatedAt: string;
  confidence: number;
  model: string;
}

export interface HealthFactor {
  label: string;
  score: number;
  change: number;
  status: 'strong' | 'watch' | 'risk';
}

export interface BusinessHealth {
  score: number;
  label: string;
  summary: string;
  change: number;
  factors: HealthFactor[];
}

export interface ForecastPoint {
  date: string;
  label: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

export interface DemandForecast {
  points: ForecastPoint[];
  next7DaysRevenue: number;
  expectedGrowth: number;
  peakDay: string;
  confidence: number;
  summary: string;
}

export interface RestockRecommendation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  dailyVelocity: number;
  daysRemaining: number;
  recommendedQuantity: number;
  estimatedCost: number;
  priority: 'urgent' | 'soon' | 'watch';
  confidence: number;
  reason: string;
}

export interface CustomerInsight {
  id: string;
  name: string;
  email: string;
  segment: 'VIP' | 'Loyal' | 'At risk' | 'New';
  lifetimeValue: number;
  orders: number;
  lastOrderDaysAgo: number;
  trend: number;
  opportunity: string;
  recommendedAction: string;
}

export interface ProductInsight {
  id: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  margin: number;
  unitsSold: number;
  growth: number;
  stockCoverDays: number;
  demandScore: number;
  signal: 'Rising' | 'Stable' | 'Declining';
  recommendation: string;
}

export interface ProfitDriver {
  label: string;
  impact: number;
  detail: string;
  type: 'revenue' | 'cost' | 'margin';
}

export interface ProfitAnalysis {
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  projectedProfit: number;
  opportunity: number;
  drivers: ProfitDriver[];
  summary: string;
}

export interface ProductPairing {
  id: string;
  primaryProduct: string;
  suggestedProduct: string;
  attachRate: number;
  estimatedLift: number;
  estimatedIncrementalRevenue: number;
  confidence: number;
  rationale: string;
}

export interface BusinessAlert {
  id: string;
  type: 'inventory' | 'revenue' | 'customer' | 'margin';
  title: string;
  message: string;
  severity: RiskLevel;
  action: string;
  createdAt: string;
  metric?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  suggestions?: string[];
  insightIds?: string[];
}

export interface AIDashboardData {
  meta: AIInsightMeta;
  health: BusinessHealth;
  forecast: DemandForecast;
  restockRecommendations: RestockRecommendation[];
  customers: CustomerInsight[];
  products: ProductInsight[];
  profit: ProfitAnalysis;
  crossSell: ProductPairing[];
  alerts: BusinessAlert[];
}

export interface CopilotContext {
  question: string;
  dashboard: AIDashboardData;
}

export interface CopilotResponse {
  answer: string;
  suggestions: string[];
  relatedAlertIds: string[];
}
