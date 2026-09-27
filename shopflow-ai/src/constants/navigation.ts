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
import { OWNER_ROLES } from './permissions';
import { ROUTES } from './routes';

const OWNER = [...OWNER_ROLES];

/**
 * Primary sidebar navigation.
 * All management, reporting, AI and inventory items are owner-only.
 * Cashiers have a dedicated full-screen billing workspace (`/billing`)
 * and never use this navigation.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, roles: OWNER },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog',
    items: [
      { id: 'inventory', label: 'Inventory', path: ROUTES.INVENTORY, icon: Package, roles: OWNER },
      { id: 'products', label: 'Products', path: ROUTES.PRODUCTS, icon: Tags, roles: OWNER },
      { id: 'categories', label: 'Categories', path: ROUTES.CATEGORIES, icon: FolderOpen, roles: OWNER },
      { id: 'suppliers', label: 'Suppliers', path: ROUTES.SUPPLIERS, icon: Truck, roles: OWNER },
      { id: 'customers', label: 'Customers', path: ROUTES.CUSTOMERS, icon: Users, roles: OWNER },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    items: [
      { id: 'pos', label: 'POS', path: ROUTES.POS, icon: ScanLine, badge: 'Live', roles: OWNER },
      { id: 'sales', label: 'Sales', path: ROUTES.SALES, icon: Receipt, roles: OWNER },
      { id: 'purchases', label: 'Purchases', path: ROUTES.PURCHASES, icon: ClipboardList, roles: OWNER },
    ],
  },
  {
    id: 'insight',
    title: 'Insight',
    items: [
      { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: BarChart3, roles: OWNER },
      { id: 'analytics', label: 'Analytics', path: ROUTES.ANALYTICS, icon: LineChart, roles: OWNER },
      { id: 'ai-insights', label: 'AI Insights', path: ROUTES.AI_INSIGHTS, icon: BrainCircuit, badge: 'AI', roles: OWNER },
    ],
  },
  {
    id: 'footer',
    items: [
      { id: 'settings', label: 'Settings', path: ROUTES.SETTINGS, icon: Settings, dividerBefore: true, roles: OWNER },
      { id: 'help', label: 'Help', path: ROUTES.HELP, icon: HelpCircle },
    ],
  },
];

/** Flattened lookup used by the breadcrumb + command menu. */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);