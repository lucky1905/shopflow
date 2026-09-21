import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export type ConfirmTone = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isLoading?: boolean;
  /** Disables the confirm button (e.g. required fields missing upstream). */
  confirmDisabled?: boolean;
}

const TONE_STYLES: Record<ConfirmTone, { icon: typeof Info; className: string; variant: 'default' | 'destructive' | 'outline' }> = {
  default: {
    icon: Info,
    className: 'bg-primary/10 text-primary ring-1 ring-primary/15',
    variant: 'default',
  },
  danger: {
    icon: ShieldAlert,
    className: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
    variant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning ring-1 ring-warning/20',
    variant: 'default',
  },
  success: {
    icon: CheckCircle2,
    className: 'bg-success/10 text-success ring-1 ring-success/20',
    variant: 'default',
  },
};

/**
 * Standard "are you sure?" dialog for destructive or irreversible actions.
 * Handles async confirms via the `isLoading` prop supplied by the caller.
 */
export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isLoading = false,
  confirmDisabled = false,
}: ConfirmationDialogProps) {
  const { icon: Icon, className, variant } = TONE_STYLES[tone];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      icon={
        <span
          className={cn(
            'flex h-full w-full items-center justify-center rounded-lg',
            className,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => void onConfirm()}
            isLoading={isLoading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {description ??
          'This action cannot be undone. Please confirm that you want to continue.'}
      </p>
    </Modal>
  );
}

export default ConfirmationDialog;