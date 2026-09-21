import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Package,
  Receipt,
  ScanLine,
  Settings,
  Tags,
  Truck,
  Users,
} from 'lucide-react';
import type { NavSection } from '@/types';
import { ROUTES } from './routes';

/**
 * Primary sidebar navigation.
 * Order matters: items render top to bottom, sections render in array order.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog',
    items: [
      { id: 'inventory', label: 'Inventory', path: ROUTES.INVENTORY, icon: Package },
      { id: 'products', label: 'Products', path: ROUTES.PRODUCTS, icon: Tags },
      { id: 'categories', label: 'Categories', path: ROUTES.CATEGORIES, icon: FolderOpen },
      { id: 'suppliers', label: 'Suppliers', path: ROUTES.SUPPLIERS, icon: Truck },
      { id: 'customers', label: 'Customers', path: ROUTES.CUSTOMERS, icon: Users },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    items: [
      { id: 'pos', label: 'POS', path: ROUTES.POS, icon: ScanLine, badge: 'Live' },
      { id: 'sales', label: 'Sales', path: ROUTES.SALES, icon: Receipt },
      { id: 'purchases', label: 'Purchases', path: ROUTES.PURCHASES, icon: ClipboardList },
    ],
  },
  {
    id: 'insight',
    title: 'Insight',
    items: [
      { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', path: ROUTES.ANALYTICS, icon: LineChart },
      { id: 'ai-insights', label: 'AI Insights', path: ROUTES.AI_INSIGHTS, icon: BrainCircuit, badge: 'AI' },
    ],
  },
  {
    id: 'footer',
    items: [
      { id: 'settings', label: 'Settings', path: ROUTES.SETTINGS, icon: Settings, dividerBefore: true },
      { id: 'help', label: 'Help', path: ROUTES.HELP, icon: HelpCircle },
    ],
  },
];

/** Flattened lookup used by the breadcrumb + command menu. */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);