'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  info: {
    container: 'bg-neutral-50 border-neutral-200 text-neutral-800',
    icon: 'text-neutral-500',
  },
  success: {
    container: 'bg-neutral-50 border-neutral-300 text-neutral-800',
    icon: 'text-neutral-700',
  },
  warning: {
    container: 'bg-neutral-50 border-neutral-300 text-neutral-800',
    icon: 'text-neutral-600',
  },
  error: {
    container: 'bg-neutral-100 border-neutral-300 text-neutral-900',
    icon: 'text-neutral-700',
  },
};

const icons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const Icon = icons[variant];
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative flex gap-3 rounded-md border p-4',
        styles.container,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', styles.icon)} />
      <div className="flex-1">
        {title && <h5 className="mb-1 font-medium">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
