import { BarChart3, BrainCircuit, ClipboardList, FileText, FolderOpen, HelpCircle, Package, Settings, ShoppingCart, Tags, Truck, Users } from 'lucide-react';
import { PlaceholderPage } from './PlaceholderPage';

export function InventoryPage() {
  return <PlaceholderPage title="Inventory" description="Products, variants, categories and stock levels." icon={<Package className="h-5 w-5" />} />;
}

export function POSPage() {
  return <PlaceholderPage title="Point of Sale" description="Fast checkout, discounts, taxes and receipts." icon={<ShoppingCart className="h-5 w-5" />} />;
}

export function CustomersPage() {
  return <PlaceholderPage title="Customers" description="Profiles, segments and purchase history." icon={<Users className="h-5 w-5" />} />;
}

export function SuppliersPage() {
  return <PlaceholderPage title="Suppliers" description="Vendor directory, lead times and purchase orders." icon={<Truck className="h-5 w-5" />} />;
}

export function SalesPage() {
  return <PlaceholderPage title="Sales" description="Orders, invoices, returns and refunds." icon={<FileText className="h-5 w-5" />} />;
}

export function ReportsPage() {
  return <PlaceholderPage title="Reports" description="Sales, inventory and profit reports with exports." icon={<BarChart3 className="h-5 w-5" />} />;
}

export function AnalyticsPage() {
  return <PlaceholderPage title="Analytics" description="Trends, cohorts and store performance dashboards." icon={<BarChart3 className="h-5 w-5" />} />;
}

export function AIInsightsPage() {
  return <PlaceholderPage title="AI Insights" description="Demand forecasts, anomalies and reorder suggestions." icon={<BrainCircuit className="h-5 w-5" />} />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Store profile, users, roles, taxes and preferences." icon={<Settings className="h-5 w-5" />} />;
}

export function HelpPage() {
  return <PlaceholderPage title="Help & Support" description="Documentation, shortcuts and contacting support." icon={<HelpCircle className="h-5 w-5" />} />;
}

export function ProfilePage() {
  return <PlaceholderPage title="Profile" description="Your account details, security and sessions." icon={<Users className="h-5 w-5" />} />;
}

export function ProductsPage() {
  return <PlaceholderPage title="Products" description="Catalog, variants, pricing and barcodes." icon={<Tags className="h-5 w-5" />} />;
}

export function CategoriesPage() {
  return <PlaceholderPage title="Categories" description="Category tree, attributes and merchandising." icon={<FolderOpen className="h-5 w-5" />} />;
}

export function PurchasesPage() {
  return <PlaceholderPage title="Purchases" description="Purchase orders, receiving and supplier bills." icon={<ClipboardList className="h-5 w-5" />} />;
}
