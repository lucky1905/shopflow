import { motion } from 'framer-motion';
import { AlertTriangle, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { PosProduct } from '../types';

export interface ProductCardProps {
  product: PosProduct;
  /** Units already in the cart — rendered as a quantity chip. */
  quantityInCart: number;
  onAdd: (product: PosProduct) => void;
}

function thumbFallback(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** Tappable catalog tile for the POS product grid. */
export function ProductCard({ product, quantityInCart, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <motion.button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      whileHover={outOfStock ? undefined : { y: -2 }}
      whileTap={outOfStock ? undefined : { scale: 0.97 }}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors',
        'hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        outOfStock && 'cursor-not-allowed opacity-50 hover:border-border hover:shadow-none',
      )}
      aria-label={`Add ${product.name} to cart`}
    >
      {quantityInCart > 0 && (
        <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground shadow">
          {quantityInCart}
        </span>
      )}

      <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-highlight/10 text-lg font-bold text-primary">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          thumbFallback(product.name)
        )}
        {!outOfStock && quantityInCart === 0 && (
          <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Plus className="h-4 w-4" />
          </span>
        )}
        {quantityInCart > 0 && (
          <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium leading-tight text-foreground">{product.name}</p>
        <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
          {product.sku}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatCurrency(product.price)}
        </span>
        {outOfStock ? (
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Sold out</span>
        ) : lowStock ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {product.stock} left
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{product.stock} in stock</span>
        )}
      </div>
    </motion.button>
  );
}

export default ProductCard;