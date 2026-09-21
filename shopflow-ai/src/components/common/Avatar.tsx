import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/format';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps {
  src?: string | null;
  /** Preferred: pass the parts and let the avatar derive the initials. */
  firstName?: string;
  lastName?: string;
  /** Explicit initials override (e.g. store avatars). */
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  alt?: string;
  className?: string;
  /** Adds a ring so the avatar sits nicely on colored surfaces. */
  ring?: boolean;
}

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive',
  away: 'bg-warning',
};

/** User avatar with an initials fallback and an optional presence dot. */
export function Avatar({
  src,
  firstName,
  lastName,
  fallback,
  size = 'md',
  status,
  alt,
  className,
  ring = true,
}: AvatarProps) {
  const initials =
    fallback ?? getInitials([firstName, lastName].filter(Boolean).join(' '));

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-highlight font-semibold text-primary-foreground uppercase',
          SIZES[size],
          ring && 'ring-2 ring-background',
        )}
      >
        {src ? (
          <img src={src} alt={alt ?? initials} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>

      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background',
            STATUS_COLORS[status],
          )}
          aria-label={status}
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps {
  avatars: Array<Pick<AvatarProps, 'src' | 'firstName' | 'lastName' | 'fallback' | 'alt'>>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping stack used for team members / assignees. */
export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - visible.length;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((avatar, index) => (
        <Avatar key={index} {...avatar} size={size} />
      ))}
      {remaining > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background',
            SIZES[size],
          )}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

export default Avatar;