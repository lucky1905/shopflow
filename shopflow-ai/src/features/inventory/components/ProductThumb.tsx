import { cn } from '@/lib/utils';
import type { Product } from '../types';

const GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-sky-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];

function gradientFor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 997;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export interface ProductThumbProps {
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'isFeatured'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-9 w-9 rounded-lg text-[10px]',
  md: 'h-11 w-11 rounded-xl text-xs',
  lg: 'h-24 w-24 rounded-2xl text-2xl',
} as const;

/**
 * Product image with graceful fallback:
 * uploaded/remote image → `<img>`; otherwise a deterministic gradient tile
 * with the product's initials (matches the Pulse visual language).
 */
export function ProductThumb({ product, size = 'md', className }: ProductThumbProps) {
  const initials = product.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();

  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        className={cn(
          SIZES[size],
          'shrink-0 border border-black/[0.06] object-cover dark:border-white/[0.08]',
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        SIZES[size],
        'relative flex shrink-0 select-none items-center justify-center bg-gradient-to-br font-black text-white',
        gradientFor(product.id),
        className,
      )}
    >
      {initials}
      {product.isFeatured && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-amber-400" />
      )}
    </span>
  );
}

export default ProductThumb;
