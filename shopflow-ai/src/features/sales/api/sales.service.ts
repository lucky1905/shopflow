import { API_ENDPOINTS } from '@/constants';
import { sleep } from '@/lib/utils';
import { httpGet, httpPost, normalizeApiError } from '@/services/api';
import type { PaginatedResponse } from '@/types';
import { rangeDays } from '../utils';
import type {
  ChannelPoint,
  InvoiceDetail,
  InvoiceSummary,
  SalesAnalytics,
  SalesDashboardStats,
  SalesDateRange,
  SalesFilters,
  SalesReturnFilters,
  SalesReturnRecord,
  SalesTrendPoint,
  TopProductPoint,
} from '../types';
import { SALES_MOCK_LATENCY_MS, salesMockDb } from './sales.mock';

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

function unwrap<T>(response: T): T {
  // The FastAPI backend returns the resource directly, with no data envelope.
  return response;
}

function rethrow(error: unknown): never {
  throw normalizeApiError(error);
}

/* -------------------------------------------------------------------------- */
/*  Service contract                                                          */
/* -------------------------------------------------------------------------- */

export interface SalesService {
  invoices: {
    list(filters: SalesFilters): Promise<PaginatedResponse<InvoiceSummary>>;
    get(id: string): Promise<InvoiceDetail>;
    recent(limit: number): Promise<InvoiceSummary[]>;
  };
  returns: {
    list(filters: SalesReturnFilters): Promise<PaginatedResponse<SalesReturnRecord>>;
    process(id: string): Promise<SalesReturnRecord>;
  };
  analytics: {
    dashboard(): Promise<SalesDashboardStats>;
    trend(range: SalesDateRange): Promise<SalesTrendPoint[]>;
    topProducts(range: SalesDateRange): Promise<TopProductPoint[]>;
    channels(range: SalesDateRange): Promise<ChannelPoint[]>;
    full(range: SalesDateRange): Promise<SalesAnalytics>;
  };
}

/* -------------------------------------------------------------------------- */
/*  Implementation â€” mock first, real HTTP when the backend lands             */
/* -------------------------------------------------------------------------- */

export const salesService: SalesService = {
  invoices: {
    async list(filters) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.listInvoices(filters);
      }
      try {
        const response = await httpGet<PaginatedResponse<InvoiceSummary>>(
          API_ENDPOINTS.SALES_INVOICES,
          { params: { ...filters } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async get(id) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        const invoice = salesMockDb.getInvoice(id);
        if (!invoice) throw { message: 'Invoice not found.', status: 404 };
        return invoice;
      }
      try {
        const response = await httpGet<InvoiceDetail>(`${API_ENDPOINTS.SALES_INVOICES}/${id}`);
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async recent(limit) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 3);
        return salesMockDb.recentInvoices(limit);
      }
      try {
        const response = await httpGet<InvoiceSummary[]>(
          `${API_ENDPOINTS.SALES_INVOICES}/recent`,
          { params: { limit } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },

  returns: {
    async list(filters) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.listReturns(filters);
      }
      try {
        const response = await httpGet<PaginatedResponse<SalesReturnRecord>>(
          API_ENDPOINTS.SALES_RETURNS,
          { params: { ...filters } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async process(id) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS);
        const record = salesMockDb.processReturn(id);
        if (!record) throw { message: 'Return not found.', status: 404 };
        return record;
      }
      try {
        const response = await httpPost<SalesReturnRecord, { id: string }>(
          `${API_ENDPOINTS.SALES_RETURNS}/${id}/process`,
          { id },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },

  analytics: {
    async dashboard() {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.dashboard();
      }
      try {
        const response = await httpGet<SalesDashboardStats>(
          `${API_ENDPOINTS.SALES_ANALYTICS}/dashboard`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async trend(range) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.trend(rangeDays(range));
      }
      try {
        const response = await httpGet<SalesTrendPoint[]>(
          `${API_ENDPOINTS.SALES_ANALYTICS}/trend`,
          { params: { range } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async topProducts(range) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.topProducts(rangeDays(range));
      }
      try {
        const response = await httpGet<TopProductPoint[]>(
          `${API_ENDPOINTS.SALES_ANALYTICS}/top-products`,
          { params: { range } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async channels(range) {
      if (USE_MOCK_API) {
        await sleep(SALES_MOCK_LATENCY_MS / 2);
        return salesMockDb.channels(rangeDays(range));
      }
      try {
        const response = await httpGet<ChannelPoint[]>(
          `${API_ENDPOINTS.SALES_ANALYTICS}/channels`,
          { params: { range } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async full(range) {
      const [stats, trend, topProducts, channels] = await Promise.all([
        salesService.analytics.dashboard(),
        salesService.analytics.trend(range),
        salesService.analytics.topProducts(range),
        salesService.analytics.channels(range),
      ]);
      return { stats, trend, topProducts, channels };
    },
  },
};




