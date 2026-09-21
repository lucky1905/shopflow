import { cn } from '@/lib/utils';
import { APP_NAME } from '@/constants';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  /** Renders the wordmark in white for dark-colored marketing surfaces. */
  inverted?: boolean;
}

const SIZES = {
  sm: { mark: 'h-7 w-7', text: 'text-sm' },
  md: { mark: 'h-9 w-9', text: 'text-base' },
  lg: { mark: 'h-11 w-11', text: 'text-lg' },
} as const;

/**
 * ShopFlow AI brand mark (inline SVG – no asset pipeline required).
 * The mark combines a box (inventory) with a spark (AI).
 */
export function Logo({ size = 'md', showWordmark = true, className, inverted = false }: LogoProps) {
  const styles = SIZES[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 40 40"
        role="img"
        aria-label={`${APP_NAME} logo`}
        className={cn('shrink-0 rounded-xl shadow-sm', styles.mark)}
      >
        <defs>
          <linearGradient id="shopflow-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(168.7 82% 33%)" />
            <stop offset="100%" stopColor="hsl(221.2 83.2% 53.3%)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#shopflow-logo-gradient)" />
        <path
          d="M12.5 15.5 20 11.5l7.5 4v9L20 28.5l-7.5-4v-9Z"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12.5 15.5 20 19.5l7.5-4M20 19.5v9" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="m26.5 24.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"
          fill="white"
        />
      </svg>

      {showWordmark && (
        <span className={cn('flex flex-col leading-none', styles.text)}>
          <span
            className={cn(
              'font-semibold tracking-tight',
              inverted ? 'text-white' : 'text-foreground',
            )}
          >
            ShopFlow <span className="text-primary">AI</span>
          </span>
        </span>
      )}
    </span>
  );
}

export default Logo;