'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { sanitizeForSuggestions } from '@/lib/sanitize';
import { SuggestionCard } from './SuggestionCard';
import { cn } from '@/lib/utils';
import type { TaxSuggestion } from '@/types/ai';

interface SuggestionsPanelProps {
  maxVisible?: number;
  className?: string;
}

export function SuggestionsPanel({ maxVisible = 3, className }: SuggestionsPanelProps) {
  const { currentFiling, calculateSummary } = useTaxFiling();
  const [suggestions, setSuggestions] = useState<TaxSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastFetchHash, setLastFetchHash] = useState<string>('');

  // Create a hash of the filing data to detect meaningful changes
  const filingHash = useMemo(() => {
    if (!currentFiling) return '';
    const summary = calculateSummary();
    return JSON.stringify({
      income: summary.totalIncome,
      deductions: summary.totalDeductions,
      province: currentFiling.personalInfo.province,
    });
  }, [currentFiling, calculateSummary]);

  // Fetch suggestions when filing data changes
  useEffect(() => {
    if (!currentFiling || filingHash === lastFetchHash) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const sanitizedData = sanitizeForSuggestions(currentFiling);
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sanitizedData, useAI: false }), // Start with static only
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
        setLastFetchHash(filingHash);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [currentFiling, filingHash, lastFetchHash]);

  const visibleSuggestions = isExpanded
    ? suggestions
    : suggestions.slice(0, maxVisible);

  const hasMore = suggestions.length > maxVisible;

  if (!currentFiling) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-neutral-900">
            Smart Suggestions
          </h3>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {suggestions.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">
            {isLoading
              ? 'Analyzing your return...'
              : 'No suggestions at this time. Keep adding your tax information.'}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}

            {/* Expand/collapse button */}
            {hasMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-neutral-600 hover:text-black w-full justify-center pt-2"
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show {suggestions.length - maxVisible} more{' '}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
