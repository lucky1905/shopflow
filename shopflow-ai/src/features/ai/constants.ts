export const AI_MOCK_LATENCY_MS = 650;
export const AI_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const AI_VIEWS: ReadonlyArray<{ id: import('./types').AIView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'forecast', label: 'Forecasting' },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products' },
  { id: 'profit', label: 'Profit' },
];

export const FORECAST_RANGES = ['7D', '30D', '90D'] as const;

export const COPILOT_STARTERS = [
  'What should I restock today?',
  'Why did profit margin change?',
  'Which customers need attention?',
] as const;
