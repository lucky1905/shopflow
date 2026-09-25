import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, RotateCcw, Send, Sparkles, User } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { COPILOT_STARTERS } from '../constants';
import { useCopilotChat } from '../api/queries';
import { useAIWorkspaceStore } from '../hooks/useAIWorkspaceStore';
import { cn } from '@/lib/utils';
import type { AIDashboardData, CopilotMessage } from '../types';

export interface CopilotPanelProps {
  /** Workspace snapshot so answers stay consistent with the rendered charts. */
  dashboard?: AIDashboardData;
  className?: string;
}

let messageCounter = 0;
const nextId = () => `copilot-${Date.now()}-${(messageCounter += 1)}`;

/**
 * AI Copilot. The transcript is persisted in Zustand; replies come from the
 * `useCopilotChat` mutation, so swapping the mock for a real LLM endpoint is a
 * service-layer change only.
 */
export function CopilotPanel({ dashboard, className }: CopilotPanelProps) {
  const messages = useAIWorkspaceStore((state) => state.messages);
  const addMessage = useAIWorkspaceStore((state) => state.addMessage);
  const clearConversation = useAIWorkspaceStore((state) => state.clearConversation);
  const chat = useCopilotChat();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, chat.isPending]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || !dashboard || chat.isPending) return;

    addMessage({ id: nextId(), role: 'user', content: trimmed, timestamp: new Date().toISOString() });
    setDraft('');

    try {
      const response = await chat.mutateAsync({ question: trimmed, dashboard });
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
        insightIds: response.relatedAlertIds,
      });
    } catch {
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: 'I could not reach the insight service just now. Please try that question again in a moment.',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const lastSuggestions =
    [...messages].reverse().find((message) => message.role === 'assistant')?.suggestions ?? [];
  const suggestions = messages.length <= 1 ? [...COPILOT_STARTERS] : lastSuggestions;

  return (
    <SectionCard
      title="AI Copilot"
      description="Ask about demand, margins, customers or what to reorder."
      icon={<Bot className="h-4 w-4" />}
      className={className}
      action={
        <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={clearConversation}>
          Reset
        </Button>
      }
    >
      <div className="flex h-[420px] flex-col">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          <Transcript messages={messages} />
          {chat.isPending && <TypingBubble />}
        </div>

        {suggestions.length > 0 && !chat.isPending && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={!dashboard}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          className="mt-3 flex items-end gap-2 border-t border-border pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about demand, margin or restocking…"
            rows={2}
            className="min-h-[44px] flex-1 resize-none"
            disabled={chat.isPending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={chat.isPending}
            disabled={!dashboard || !draft.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </SectionCard>
  );
}
// __APPEND_COPILOT_PARTS__


function Transcript({ messages }: { messages: CopilotMessage[] }) {
  return (
    <AnimatePresence initial={false}>
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('flex gap-2.5', message.role === 'user' && 'flex-row-reverse')}
        >
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              message.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {message.role === 'assistant' ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
          </div>
          <div
            className={cn(
              'max-w-[85%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
              message.role === 'assistant'
                ? 'border border-border bg-muted/40 text-foreground'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {message.content}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
