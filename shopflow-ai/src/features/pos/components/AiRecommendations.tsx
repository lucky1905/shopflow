import { useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks';
import { formatCurrency } from '@/utils/format';
import { RECOMMENDATION_TAG_META } from '../constants';
import { useLookupProduct, usePosRecommendations } from '../api';
import { useCartStore } from '../hooks';
import type { AiRecommendation, PosProduct } from '../types';

export interface AiRecommendationsProps {
  onAddProduct: (product: PosProduct) => void;
}

/**
 * "Smart picks" strip — cross-sell / upsell / affinity suggestions for the
 * current basket (popular sellers while the cart is empty).
 */
export function AiRecommendations({ onAddProduct }: AiRecommendationsProps) {
  // Select the stable `items` reference, then derive the id list. Returning a
  // fresh array straight from a Zustand selector re-creates it on every
  // getSnapshot() call → infinite re-render ("Maximum update depth exceeded").
  const items = useCartStore((state) => state.items);
  const productIds = useMemo(() => items.map((item) => item.productId), [items]);
  const { data: recommendations = [], isLoading } = usePosRecommendations(productIds);
  const lookup = useLookupProduct();
  const toast = useToast();

  if (!isLoading && recommendations.length === 0) return null;

  const handleAdd = (recommendation: AiRecommendation): void => {
    // Resolve the full catalog entry so stock limits stay accurate.
    lookup.mutate(recommendation.productId, {
      onSuccess: (product) => {
        if (!product) {
          toast.error(`${recommendation.name} is no longer available.`);
          return;
        }
        onAddProduct(product);
      },
      onError: (error) => toast.fromError(error),
    });
  };

  return (
    <SectionCard
      icon={<Sparkles className="h-4.5 w-4.5" />}
      title="Smart picks"
      description="AI suggestions based on what shoppers buy together."
      noPadding
    >
      <div className="scrollbar-none flex gap-3 overflow-x-auto p-4 pt-1">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 w-52 shrink-0 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}

        {!isLoading &&
          recommendations.map((recommendation) => {
            const meta = RECOMMENDATION_TAG_META[recommendation.tag];
            return (
              <button
                key={recommendation.productId}
                type="button"
                onClick={() => handleAdd(recommendation)}
                className="group flex w-52 shrink-0 flex-col gap-1.5 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={meta.badge} size="sm">
                    {meta.label}
                  </Badge>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {recommendation.name}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{recommendation.reason}</p>
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(recommendation.price)}
                </p>
              </button>
            );
          })}
      </div>
    </SectionCard>
  );
}

export default AiRecommendations;