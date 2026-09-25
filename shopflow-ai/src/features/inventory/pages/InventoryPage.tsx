import { useNavigate } from 'react-router-dom';
import { FolderOpen, Package, Truck } from 'lucide-react';
import { ROUTES } from '@/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { InventoryHeader } from '../components/InventoryHeader';
import { ProductWorkspace } from '../components/ProductWorkspace';

/**
 * Inventory module home: analytics cards, low-stock alerts, stock activity and
 * the full product table with CRUD, bulk actions and the details drawer.
 */
export function InventoryPage() {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="full">
      <InventoryHeader
        icon={<Package className="h-6 w-6" />}
        title="Inventory"
        description="Track stock across every product, flag what needs reordering and keep the catalog tidy."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.CATEGORIES)}
              leftIcon={<FolderOpen className="h-3.5 w-3.5" />}
            >
              Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.SUPPLIERS)}
              leftIcon={<Truck className="h-3.5 w-3.5" />}
            >
              Suppliers
            </Button>
          </>
        }
      />

      <ProductWorkspace variant="inventory" />
    </PageContainer>
  );
}

export default InventoryPage;
