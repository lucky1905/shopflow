import { API_ENDPOINTS } from '@/constants';
import { sleep } from '@/lib/utils';
import { httpGet, httpPost, normalizeApiError } from '@/services/api';
import type { PaginatedResponse } from '@/types';
import { rangeDays } from '../utils';
import type {
  Grn,
  GrnFilters,
  GrnInput,
  PaymentFilters,
  PaymentRecordInput,
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderFilters,
  PurchaseSupplier,
  PurchaseTrendRange,
  PurchasesDashboardStats,
  SupplierPaymentRow,
  SpendTrendPoint,
  SupplierSpendPoint,
  PoStatusPoint,
} from '../types';
import { PURCHASES_MOCK_LATENCY_MS, purchasesMockDb } from './purchases.mock';

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

export interface PurchasesService {
  orders: {
    list(filters: PurchaseOrderFilters): Promise<PaginatedResponse<PurchaseOrder>>;
    get(id: string): Promise<PurchaseOrderDetail>;
    send(id: string): Promise<PurchaseOrder>;
    markInTransit(id: string): Promise<PurchaseOrder>;
    deliveries(): Promise<PurchaseOrder[]>;
  };
  suppliers: {
    list(): Promise<PurchaseSupplier[]>;
  };
  grns: {
    list(filters: GrnFilters): Promise<PaginatedResponse<Grn>>;
    create(input: GrnInput): Promise<Grn>;
  };
  payments: {
    list(filters: PaymentFilters): Promise<PaginatedResponse<SupplierPaymentRow>>;
    record(input: PaymentRecordInput): Promise<SupplierPaymentRow>;
  };
  analytics: {
    dashboard(): Promise<PurchasesDashboardStats>;
    trend(range: PurchaseTrendRange): Promise<SpendTrendPoint[]>;
    supplierSpend(): Promise<SupplierSpendPoint[]>;
    statusSplit(): Promise<PoStatusPoint[]>;
  };
}

/* -------------------------------------------------------------------------- */
/*  Implementation â€” mock first, real HTTP when the backend lands             */
/* -------------------------------------------------------------------------- */

export const purchasesService: PurchasesService = {
  orders: {
    async list(filters) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.listOrders(filters);
      }
      try {
        const response = await httpGet<PaginatedResponse<PurchaseOrder>>(
          API_ENDPOINTS.PURCHASE_ORDERS,
          { params: { ...filters } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async get(id) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        const order = purchasesMockDb.getOrder(id);
        if (!order) throw { message: 'Purchase order not found.', status: 404 };
        return order;
      }
      try {
        const response = await httpGet<PurchaseOrderDetail>(
          `${API_ENDPOINTS.PURCHASE_ORDERS}/${id}`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async send(id) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS);
        const order = purchasesMockDb.sendOrder(id);
        if (!order) throw { message: 'Purchase order not found.', status: 404 };
        return order;
      }
      try {
        const response = await httpPost<PurchaseOrder, { id: string }>(
          `${API_ENDPOINTS.PURCHASE_ORDERS}/${id}/send`,
          { id },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async markInTransit(id) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS);
        const order = purchasesMockDb.markInTransit(id);
        if (!order) throw { message: 'Purchase order not found.', status: 404 };
        return order;
      }
      try {
        const response = await httpPost<PurchaseOrder, { id: string }>(
          `${API_ENDPOINTS.PURCHASE_ORDERS}/${id}/transit`,
          { id },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async deliveries() {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.deliveries();
      }
      try {
        const response = await httpGet<PurchaseOrder[]>(
          `${API_ENDPOINTS.PURCHASE_ORDERS}/deliveries`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },

  suppliers: {
    async list() {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 3);
        return purchasesMockDb.suppliers();
      }
      try {
        const response = await httpGet<PurchaseSupplier[]>(API_ENDPOINTS.PURCHASE_SUPPLIERS);
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },

  grns: {
    async list(filters) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.listGrns(filters);
      }
      try {
        const response = await httpGet<PaginatedResponse<Grn>>(API_ENDPOINTS.PURCHASE_GRNS, {
          params: { ...filters },
        });
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async create(input) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS);
        return purchasesMockDb.createGrn(input);
      }
      try {
        const response = await httpPost<Grn, GrnInput>(API_ENDPOINTS.PURCHASE_GRNS, input);
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },

  payments: {
    async list(filters) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.listPayments(filters);
      }
      try {
        const response = await httpGet<PaginatedResponse<SupplierPaymentRow>>(
          API_ENDPOINTS.PURCHASE_PAYMENTS,
          { params: { ...filters } },
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async record(input) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS);
        const row = purchasesMockDb.recordPayment(input);
        if (!row) throw { message: 'Purchase order not found.', status: 404 };
        return row;
      }
      try {
        const response = await httpPost<SupplierPaymentRow, PaymentRecordInput>(
          `${API_ENDPOINTS.PURCHASE_PAYMENTS}/record`,
          input,
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
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.dashboard();
      }
      try {
        const response = await httpGet<PurchasesDashboardStats>(
          `${API_ENDPOINTS.PURCHASES}/dashboard`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async trend(range) {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.trend(range);
      }
      try {
        const response = await httpGet<SpendTrendPoint[]>(`${API_ENDPOINTS.PURCHASES}/trend`, {
          params: { days: rangeDays(range) },
        });
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async supplierSpend() {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.supplierSpend();
      }
      try {
        const response = await httpGet<SupplierSpendPoint[]>(
          `${API_ENDPOINTS.PURCHASES}/supplier-spend`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },

    async statusSplit() {
      if (USE_MOCK_API) {
        await sleep(PURCHASES_MOCK_LATENCY_MS / 2);
        return purchasesMockDb.statusSplit();
      }
      try {
        const response = await httpGet<PoStatusPoint[]>(
          `${API_ENDPOINTS.PURCHASES}/status-split`,
        );
        return unwrap(response);
      } catch (error) {
        rethrow(error);
      }
    },
  },
};




