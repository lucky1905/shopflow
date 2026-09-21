import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: ReactNode;
  /** Constrain width on ultra-wide screens. */
  maxWidth?: 'full' | '7xl';
  className?: string;
}

/**
 * Standard content wrapper for dashboard pages.
 * Handles responsive padding + entrance animation so feature modules
 * only worry about their own content.
 */
export function PageContainer({ children, maxWidth = '7xl', className }: PageContainerProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8',
        maxWidth === '7xl' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </motion.main>
  );
}

export default PageContainer;
