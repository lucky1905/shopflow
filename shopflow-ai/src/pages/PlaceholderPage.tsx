import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/**
 * Stand-in for future feature modules (Inventory, POS, …).
 * Keeps every nav entry routable so the shell can be reviewed end to end.
 */
export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} icon={icon} />
      <SectionCard>
        <EmptyState
          icon={icon}
          title={`${title} module coming soon`}
          description="The foundation (routing, shell, data table, forms) is ready — business logic plugs in here next."
          action={
            <Link to={ROUTES.DASHBOARD}>
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                Back to dashboard
              </Button>
            </Link>
          }
        />
      </SectionCard>
    </PageContainer>
  );
}

export default PlaceholderPage;
