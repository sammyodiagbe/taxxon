'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  quickActions?: { label: string; prompt: string }[];
}

const defaultQuickActions = [
  { label: 'What is RRSP?', prompt: 'What is an RRSP and how does it reduce my taxes?' },
  { label: 'My refund?', prompt: "What's my estimated refund and how was it calculated?" },
  { label: 'Missing deductions?', prompt: 'Am I missing any common deductions based on my return?' },
];

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about your taxes...',
  quickActions = defaultQuickActions,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return;
    onSend(prompt);
  };

  return (
    <div className="border-t border-neutral-200 bg-white">
      {/* Quick actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={isLoading}
            className={cn(
              'flex-shrink-0 px-3 py-1 text-xs rounded-full border border-neutral-200',
              'bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 pt-2">
        <div className="flex items-end gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm outline-none text-neutral-900',
              'placeholder:text-neutral-400 disabled:cursor-not-allowed'
            )}
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className={cn(
              'flex-shrink-0 p-2 rounded-md transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              message.trim() && !isLoading
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-400'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-400 text-center">
          AI responses are for informational purposes only
        </p>
      </div>
    </div>
  );
}
