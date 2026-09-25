import { API_ENDPOINTS } from '@/constants';
import { httpGet } from '@/services/api';
import { AI_MOCK_LATENCY_MS } from '../constants';
import {
  FORECAST_RANGE_POINTS,
  aiMockDb,
  resolveCopilotRule,
} from './ai.mock';
import type {
  AIDashboardData,
  BusinessAlert,
  BusinessHealth,
  CopilotContext,
  CopilotResponse,
  DemandForecast,
  ForecastRange,
  ProductPairing,
  ProfitAnalysis,
  RestockRecommendation,
} from '../types';

/**
 * Simulated network latency so loading skeletons and optimistic UI behave
 * exactly as they will against a real AI endpoint.
 */
const delay = (ms = AI_MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

/** Trims the forecast series to the points needed for the selected range. */
function sliceForecast(forecast: DemandForecast, range: ForecastRange): DemandForecast {
  const size = FORECAST_RANGE_POINTS[range];
  const points = forecast.points.slice(-size);
  const horizon = points.filter((point) => point.forecast !== undefined);

  return {
    ...forecast,
    points,
    next7DaysRevenue:
      horizon.length > 0
        ? horizon.slice(0, 7).reduce((sum, point) => sum + (point.forecast ?? 0), 0)
        : forecast.next7DaysRevenue,
  };
}

/**
 * Single boundary between the UI and the (mock) AI backend.
/** Shape returned by `GET /predict/insights`. */
interface BackendInsights {
  top_product: string;
  current_stock: number;
  predicted_sales: number;
  recommended_order: number;
  model_accuracy?: number;
  model_name?: string;
  status?: string;
  total_units_sold?: number;
}

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

/**
 * Folds the backend's restock prediction into the AI dashboard payload.
 *
 * Only the restock queue is backend-driven: everything else (forecast,
 * segments, copilot) has no endpoint yet, so the mock dataset fills it in and
 * the restock rows are replaced with real recommendations.
 */
async function fetchBackendRestock(): Promise<RestockRecommendation[] | null> {
  if (USE_MOCK_API) return null;

  try {
    const raw = await httpGet<BackendInsights>(API_ENDPOINTS.AI_PREDICT);
    if (!raw || !raw.top_product || raw.top_product === 'No Sales Yet') return null;

    const predicted = Number(raw.predicted_sales) || 0;
    const onHand = Number(raw.current_stock) || 0;
    const cover = predicted > 0 ? Math.round((onHand / predicted) * 10) / 10 : 30;
    const quantity = Math.max(0, Number(raw.recommended_order) || 0);

    return [
      {
        id: `restock-${raw.top_product}`,
        productId: raw.top_product,
        productName: raw.top_product,
        sku: '—',
        currentStock: onHand,
        dailyVelocity: predicted,
        daysRemaining: cover,
        recommendedQuantity: quantity,
        estimatedCost: 0,
        priority: quantity > 0 ? 'urgent' : 'watch',
        confidence: Number(raw.model_accuracy) || 0.74,
        reason:
          raw.status ?? `Random Forest forecast of ${predicted} units/day with ${onHand} on hand.`,
      },
    ];
  } catch {
    return null;
  }
}

/**
 * Single boundary between the AI workspace UI and its data source.
 *
 * Restock recommendations come from `GET /predict/insights` when the backend
 * is reachable; the remaining panels have no endpoint yet and continue to use
 * the bundled dataset.
 */
export const aiService = {
  /** One request powers the whole dashboard; views slice it client-side. */
  async getDashboard(): Promise<AIDashboardData> {
    await delay();
    const base = aiMockDb.getDashboard();
    const restock = await fetchBackendRestock();

    return restock ? { ...base, restockRecommendations: restock } : base;
  },

  async getHealth(): Promise<BusinessHealth> {
    await delay();
    return aiMockDb.getDashboard().health;
  },

  async getForecast(range: ForecastRange): Promise<DemandForecast> {
    await delay();
    return sliceForecast(aiMockDb.getDashboard().forecast, range);
  },

  async getRestockRecommendations(): Promise<RestockRecommendation[]> {
    await delay();
    const restock = await fetchBackendRestock();
    return restock ?? aiMockDb.getDashboard().restockRecommendations;
  },

  getProfitAnalysis: async (): Promise<ProfitAnalysis> => {
    await delay();
    return aiMockDb.getDashboard().profit;
  },

  getCrossSell: async (): Promise<ProductPairing[]> => {
    await delay();
    return aiMockDb.getDashboard().crossSell;
  },

  getAlerts: async (): Promise<BusinessAlert[]> => {
    await delay();
    return aiMockDb.getDashboard().alerts;
  },

  /**
   * Stands in for a streaming LLM completion. The rule engine inspects the
   * question and answers with real numbers taken from the same dataset the
   * rest of the dashboard renders, so answers stay consistent with the UI.
   */
  askCopilot: async ({ question, dashboard }: CopilotContext): Promise<CopilotResponse> => {
    await delay(Math.round(AI_MOCK_LATENCY_MS * 1.4));
    const rule = resolveCopilotRule(question);
    return rule.build(dashboard);
  },
};

