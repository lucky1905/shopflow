import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, BrainCircuit, Package, ShoppingCart } from 'lucide-react';
import { APP_DESCRIPTION, ROUTES } from '@/constants';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { icon: Package, title: 'Smart inventory', text: 'Real-time stock, variants, barcodes and low-stock alerts.' },
  { icon: ShoppingCart, title: 'Fast POS', text: 'Checkout in seconds with discounts, taxes and receipts.' },
  { icon: BarChart3, title: 'Reports & analytics', text: 'Sales, profit and turnover dashboards out of the box.' },
  { icon: BrainCircuit, title: 'AI insights', text: 'Demand forecasts and reorder suggestions for every SKU.' },
];

/** Public marketing landing – the only route that uses `PublicLayout`. */
export function LandingPage() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            AI-powered inventory & POS
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Run your retail store on <span className="text-primary">autopilot</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {APP_DESCRIPTION}. Track stock, sell faster and let AI forecast what to order next.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start free trial
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export default LandingPage;
