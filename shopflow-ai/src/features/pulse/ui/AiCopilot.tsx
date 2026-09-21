import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COPILOT_GREETING, SUGGESTIONS } from '../data';
import type { CopilotMessage } from '../types';
import { GlassCard, Reveal } from './primitives';

const FALLBACK_REPLY =
  'On it — I cross-checked that against the last 30 days of sales. Nothing looks risky, and I have logged a follow-up in your AI Insights feed. Want me to turn it into a task for the team?';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1" aria-label="Copilot is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.14 }}
          className="h-1.5 w-1.5 rounded-full bg-violet-500"
        />
      ))}
    </span>
  );
}

/**
 * AI assistant widget — a conversational glass panel with suggestion chips
 * and mock "thinking" replies. Anchors the AI-first identity of the redesign.
 */
export function AiCopilot({ className }: { className?: string }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { id: 'm0', role: 'assistant', text: COPILOT_GREETING },
  ]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    const query = text.trim();
    if (!query || typing) return;
    const match = SUGGESTIONS.find((s) => s.label.toLowerCase() === query.toLowerCase());
    const reply = match?.reply ?? FALLBACK_REPLY;

    setMessages((prev) => [...prev, { id: `u${Date.now()}`, role: 'user', text: query }]);
    setDraft('');
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a${Date.now()}`, role: 'assistant', text: reply }]);
      setTyping(false);
    }, 1100);
  };

  return (
    <Reveal delay={0.24} className={cn('h-full', className)}>
      <GlassCard className="relative flex h-full flex-col p-6 sm:p-7">
        {/* Ambient AI glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-3xl dark:opacity-60" />

        <div className="relative flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles className="h-4.5 w-4.5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </span>
          </span>
          <div>
            <p className="text-[15px] font-bold tracking-tight">ShopFlow Copilot</p>
            <p className="text-[11px] font-medium text-muted-foreground">Your AI ops analyst · online</p>
          </div>
        </div>

        {/* Thread */}
        <div ref={threadRef} className="scrollbar-none relative mt-5 min-h-[220px] flex-1 space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <p
                  className={cn(
                    'max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed',
                    m.role === 'assistant'
                      ? 'rounded-2xl rounded-tl-md border border-black/[0.05] bg-black/[0.03] dark:border-white/[0.06] dark:bg-white/[0.05]'
                      : 'rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/25',
                  )}
                >
                  {m.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <div className="flex">
              <span className="rounded-2xl rounded-tl-md border border-black/[0.05] bg-black/[0.03] px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.05]">
                <TypingDots />
              </span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="relative mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => send(s.label)}
              disabled={typing}
              className="rounded-full border border-black/[0.07] bg-black/[0.02] px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all hover:border-violet-400/50 hover:text-violet-500 disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.04] dark:hover:text-violet-300"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form
          className="relative mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about revenue, stock, suppliers…"
            className="min-w-0 flex-1 rounded-xl border border-black/[0.07] bg-background/70 px-3.5 py-2.5 text-[13px] outline-none backdrop-blur transition-colors placeholder:text-muted-foreground/70 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15 dark:border-white/[0.09]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || typing}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </GlassCard>
    </Reveal>
  );
}

export default AiCopilot;