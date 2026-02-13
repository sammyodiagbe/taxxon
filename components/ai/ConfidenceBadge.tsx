'use client';

import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '@/types/ai';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

const confidenceStyles: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
  high: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    label: 'Medium',
  },
  low: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    label: 'Low',
  },
};

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const styles = confidenceStyles[confidence];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {styles.label}
    </span>
  );
}
