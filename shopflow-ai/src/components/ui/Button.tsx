import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 whitespace-nowrap
      font-medium transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.98]
    `;

    const variants = {
      default: `
        bg-primary text-primary-foreground
        hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
        active:bg-primary/95
      `,
      primary: `
        bg-primary text-primary-foreground
        hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
        active:bg-primary/95
      `,
      secondary: `
        bg-secondary text-secondary-foreground
        hover:bg-secondary/80
        active:bg-secondary/90
      `,
      outline: `
        border border-border bg-transparent
        hover:bg-accent hover:text-accent-foreground
        active:bg-accent/80
      `,
      ghost: `
        bg-transparent
        hover:bg-accent hover:text-accent-foreground
        active:bg-accent/80
      `,
      destructive: `
        bg-destructive text-destructive-foreground
        hover:bg-destructive/90
        active:bg-destructive/95
      `,
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm rounded-lg',
      sm: 'h-8 px-3 text-xs rounded-md',
      lg: 'h-12 px-8 text-base rounded-xl',
      icon: 'h-10 w-10 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
