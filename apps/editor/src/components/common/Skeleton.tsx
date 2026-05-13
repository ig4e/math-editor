// Loading placeholders. Two shapes — a row (for lists) and a card
// (for big async-loaded panels like JSXGraph). The shimmer is a simple
// CSS gradient animation rather than a JS framework — keeps it cheap.

import { cx } from '../../utils/cx';

interface BaseProps {
  className?: string;
}

export function SkeletonRow({ className }: BaseProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cx('h-4 rounded bg-border-soft animate-pulse', className)}
    />
  );
}

export function SkeletonCard({ className }: BaseProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cx(
        'rounded-xl bg-surface border border-border-soft p-3 flex flex-col gap-2',
        className,
      )}
    >
      <SkeletonRow className="w-1/3" />
      <SkeletonRow className="w-full" />
      <SkeletonRow className="w-2/3" />
    </div>
  );
}

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  return (
    <svg
      role="status"
      aria-label="Loading"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className={cx('animate-spin text-fg-muted', className)}
      fill="none"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="2.5" opacity="0.25" />
      <path d="M3 12a9 9 0 0 1 9-9" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
