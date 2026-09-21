import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = ({
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        `
        bg-card text-card-foreground
        border border-border rounded-xl
        shadow-sm hover:shadow-md
        transition-all duration-200
        `,
        className
      )}
      {...props}
    />
  );
};

const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-4 border-b border-border', className)}
      {...props}
    />
  );
};

const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
};

const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
};

const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('p-4 pt-0', className)} {...props} />
  );
};

const CardFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex items-center p-4 border-t border-border', className)}
      {...props}
    />
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
