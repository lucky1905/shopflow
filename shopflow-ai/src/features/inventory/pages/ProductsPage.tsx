import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, FolderOpen, Layers, Tags, Truck } from 'lucide-react';
import { ROUTES } from '@/constants';
import { formatNumber } from '@/utils/format';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useInventorySummary } from '../api';
import { InventoryHeader } from '../components/InventoryHeader';
import { MiniStats } from '../components/MiniStats';
import { ProductWorkspace } from '../components/ProductWorkspace';

/**
 * Catalog view of the same product data set: pricing and lifecycle focused,
 * with the identical CRUD, bulk and drawer workflows as Inventory.
 */
export function ProductsPage() {
  const navigate = useNavigate();
  const { data } = useInventorySummary();
  const stats = data?.stats;

  return (
    <PageContainer maxWidth="full">
      <InventoryHeader
        icon={<Tags className="h-6 w-6" />}
        title="Products"
        description="Catalog, pricing, barcodes and lifecycle status for every SKU."
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

      <ProductWorkspace variant="catalog">
        <MiniStats
          items={[
            {
              label: 'Total SKUs',
              value: formatNumber(stats?.totalSkus),
              hint: 'Excluding archived',
              icon: <Layers className="h-4 w-4" />,
            },
            {
              label: 'Active',
              value: formatNumber(stats?.activeSkus),
              hint: 'Sellable right now',
              icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
              label: 'Drafts',
              value: formatNumber(stats?.draftCount),
              hint: 'Not yet published',
              icon: <FileText className="h-4 w-4" />,
            },
            {
              label: 'Archived',
              value: formatNumber(stats?.archivedCount),
              hint: 'Hidden from the catalog',
              icon: <FolderOpen className="h-4 w-4" />,
            },
          ]}
        />
      </ProductWorkspace>
    </PageContainer>
  );
}

export default ProductsPage;
