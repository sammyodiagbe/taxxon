'use client';

import { useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/ChatContext';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { sanitizeForChat } from '@/lib/sanitize';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatFilingContext } from '@/types/ai';

export function ChatPanel() {
  const { currentFiling, calculateSummary } = useTaxFiling();
  const {
    messages,
    isOpen,
    isStreaming,
    toggleChat,
    closeChat,
    sendMessage,
    clearMessages,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Build chat context from current filing
  const chatContext: ChatFilingContext = useMemo(() => {
    if (!currentFiling) {
      return {
        year: new Date().getFullYear() - 1,
        province: '',
        totalIncome: 0,
        totalDeductions: 0,
        estimatedRefund: 0,
        hasT4: false,
        hasT5: false,
        hasRRSP: false,
        hasDonations: false,
        hasMedical: false,
        hasHomeOffice: false,
      };
    }

    const summary = calculateSummary();
    return sanitizeForChat(currentFiling, {
      totalIncome: summary.totalIncome,
      totalDeductions: summary.totalDeductions,
      refundOrOwing: summary.refundOrOwing,
    });
  }, [currentFiling, calculateSummary]);

  const handleSend = (content: string) => {
    sendMessage(content, chatContext);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggleChat}
        className={cn(
          'fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all',
          'bg-black text-white hover:bg-neutral-800',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 w-full sm:w-96 h-[32rem] max-h-[80vh]',
          'flex flex-col bg-white border-l border-t sm:border border-neutral-200 shadow-xl',
          'sm:rounded-tl-lg sm:bottom-6 sm:right-6 sm:rounded-lg',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-[calc(100%+24px)]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-neutral-600" />
            <h3 className="font-medium text-neutral-900">Tax Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-md hover:bg-neutral-100"
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={closeChat}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-md hover:bg-neutral-100"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <MessageCircle className="h-12 w-12 text-neutral-200 mb-4" />
              <h4 className="text-sm font-medium text-neutral-900 mb-1">
                How can I help?
              </h4>
              <p className="text-sm text-neutral-500">
                Ask questions about your tax return, deductions, or Canadian tax rules.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isStreaming} />
      </div>
    </>
  );
}
