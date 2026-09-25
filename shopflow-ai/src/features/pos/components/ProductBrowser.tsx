import { useMemo, useState, type KeyboardEvent, type RefObject } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { useDebouncedValue, useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { MAX_SEARCH_LENGTH } from '../constants';
import { useCatalogSearch, useLookupProduct, usePosCatalogCategories } from '../api';
import { useCartStore } from '../hooks';
import { sortCatalog } from '../utils';
import { ProductCard } from './ProductCard';
import type { CatalogSearch, PosProduct } from '../types';

export interface ProductBrowserProps {
  /** Controlled by the page so `/` can focus the field from anywhere. */
  searchRef: RefObject<HTMLInputElement | null>;
}

function CategoryChip({
  label,
  color,
  count,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      )}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-[10px] tabular-nums',
            active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Left pane of the split screen: barcode/name search, category filters and
 * the tap-to-add product grid with loading / empty / error states.
 */
export function ProductBrowser({ searchRef }: ProductBrowserProps) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);
  const toast = useToast();

  const search = useMemo<CatalogSearch>(
    () => ({ query: debouncedQuery, categoryId }),
    [debouncedQuery, categoryId],
  );

  const { data: products = [], isLoading, isError, error, refetch } = useCatalogSearch(search);
  const { data: categories = [] } = usePosCatalogCategories();
  const lookup = useLookupProduct();

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const qtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) map.set(item.productId, item.quantity);
    return map;
  }, [cartItems]);

  const visible = useMemo(
    () => sortCatalog(products, debouncedQuery),
    [products, debouncedQuery],
  );

  const handleAdd = (product: PosProduct): void => {
    const result = addItem(product);
    if (!result.ok) {
      toast.error(
        result.reason === 'out_of_stock'
          ? `${product.name} is out of stock.`
          : `Only ${product.stock} of ${product.name} available.`,
      );
    }
  };

  /** Enter = scanner stop / manual submit → exact lookup, then add. */
  const handleEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    const code = query.trim();
    if (!code) return;

    lookup.mutate(code, {
      onSuccess: (product) => {
        if (!product) {
          toast.error(`No product matches “${code}”.`);
          return;
        }
        handleAdd(product);
        setQuery('');
      },
      onError: (lookupError) => toast.fromError(lookupError),
    });
  };

  const clearFilters = (): void => {
    setQuery('');
    setCategoryId(null);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Input
        ref={searchRef}
        value={query}
        onChange={(event) => setQuery(event.target.value.slice(0, MAX_SEARCH_LENGTH))}
        onKeyDown={handleEnter}
        leftIcon={<Search className="h-4 w-4" />}
        placeholder="Scan barcode or search by name / SKU…"
        hint="Press Enter to add the scanned item instantly."
        isLoading={lookup.isPending}
        autoComplete="off"
        spellCheck={false}
      />

      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        <CategoryChip label="All" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            color={category.color}
            count={category.productCount}
            active={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-xl border border-border bg-card p-3"
            >
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="mt-3 h-3.5 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          compact
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={<PackageSearch className="h-5 w-5" />}
          title="No products found"
          description={
            debouncedQuery
              ? `Nothing matches “${debouncedQuery}”. Try another name, SKU or barcode.`
              : 'This category has no sellable products yet.'
          }
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantityInCart={qtyByProduct.get(product.id) ?? 0}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductBrowser;