'use client';

import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Info,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { TaxSuggestion } from '@/types/ai';

interface SuggestionCardProps {
  suggestion: TaxSuggestion;
}

const typeStyles = {
  missing_deduction: {
    icon: Lightbulb,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
  },
  validation_error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
  },
  optimization: {
    icon: DollarSign,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
  },
  info: {
    icon: Info,
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconColor: 'text-neutral-600',
    titleColor: 'text-neutral-900',
  },
};

const priorityIndicator = {
  high: 'w-1 h-full bg-red-500',
  medium: 'w-1 h-full bg-amber-400',
  low: 'w-1 h-full bg-neutral-300',
};

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const router = useRouter();
  const styles = typeStyles[suggestion.type];
  const Icon = styles.icon;

  const handleAction = () => {
    if (suggestion.actionRoute) {
      router.push(suggestion.actionRoute);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border overflow-hidden',
        styles.bg,
        styles.border
      )}
    >
      {/* Priority indicator */}
      <div className={cn('absolute left-0 top-0 bottom-0', priorityIndicator[suggestion.priority])} />

      <div className="pl-4 pr-3 py-3">
        <div className="flex gap-3">
          <div className={cn('flex-shrink-0 mt-0.5', styles.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn('text-sm font-medium', styles.titleColor)}>
              {suggestion.title}
            </h4>
            <p className="mt-1 text-sm text-neutral-600 leading-snug">
              {suggestion.description}
            </p>

            {/* Estimated impact */}
            {suggestion.estimatedImpact && suggestion.estimatedImpact > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
                <DollarSign className="h-3 w-3" />
                Potential savings: ${suggestion.estimatedImpact.toLocaleString()}
              </div>
            )}

            {/* Action button */}
            {suggestion.actionLabel && suggestion.actionRoute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAction}
                className="mt-2 -ml-2 text-neutral-600 hover:text-black"
              >
                {suggestion.actionLabel}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
