import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { lineNet } from '../utils';
import type { CartItem } from '../types';

export interface CartLineItemProps {
  item: CartItem;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

/** Single row inside the cart panel: qty steppers, discount-aware total. */
export function CartLineItem({ item, onIncrement, onDecrement, onRemove }: CartLineItemProps) {
  const atStockLimit = item.quantity >= item.stockOnHand;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.sku} · {formatCurrency(item.unitPrice)}
          {item.discountPct > 0 && (
            <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              −{item.discountPct}%
            </span>
          )}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={() => onDecrement(item.productId)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            aria-label={`Increase quantity of ${item.name}`}
            disabled={atStockLimit}
            onClick={() => onIncrement(item.productId)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <span className="ml-1 text-[10px] text-muted-foreground">
            / {item.stockOnHand} {item.unit}
          </span>
        </div>
      </div>

      <div className="flex h-full flex-col items-end justify-between gap-2">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatCurrency(lineNet(item))}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label={`Remove ${item.name} from cart`}
          onClick={() => onRemove(item.productId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default CartLineItem;