import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS } from '@/constants';
import type { NavItem } from '@/types';

interface PaletteResultsProps {
  groups: Record<string, FlatItem[]>;
  results: FlatItem[];
  active: number;
  setActive: (index: number) => void;
  go: (item: FlatItem) => void;
  query: string;
}

function PaletteResults({ groups, results, active, setActive, go, query }: PaletteResultsProps) {
  let flatIndex = -1;

  return (
    <div className="max-h-[340px] overflow-y-auto p-2">
      {results.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No matches for “{query}”. Try “sales”, “stock” or “AI”.
        </p>
      )}
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group} className="mb-1">
          <p className="px-3 pb-1 pt-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/70">
            {group}
          </p>
          {groupItems.map((item) => {
            flatIndex += 1;
            const isActive = flatIndex === active;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(results.indexOf(item))}
                onClick={() => go(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 text-foreground'
                    : 'text-foreground/75',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    isActive
                      ? 'border-violet-400/40 bg-violet-500/10 text-violet-500'
                      : 'border-black/[0.06] bg-black/[0.02] text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate text-left font-semibold">{item.label}</span>
                {item.badge && (
                  <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-black text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && <ArrowRight className="h-4 w-4 shrink-0 text-violet-500" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface FlatItem extends NavItem {
  group: string;
}

/**
 * Pulse command palette (Ctrl/⌘K) — frosted glass, grouped navigation,
 * keyboard-first (↑ ↓ ↵ esc). Replaces the previous modal-based menu.
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<FlatItem[]>(
    () =>
      NAV_SECTIONS.flatMap((section) =>
        section.items.map((item) => ({ ...item, group: section.title ?? 'Navigate' })),
      ),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.path.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after the entrance animation begins.
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (item: FlatItem) => {
    navigate(item.path);
    onClose();
  };

  const groups = results.reduce<Record<string, FlatItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl overflow-hidden rounded-3xl border border-black/[0.08] bg-card/95 shadow-[0_40px_100px_-20px_rgba(76,29,149,0.5)] backdrop-blur-2xl dark:border-white/[0.1]"
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 dark:border-white/[0.08]">
            <Search className="h-4.5 w-4.5 shrink-0 text-violet-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
                if (e.key === 'Enter' && results[active]) {
                  go(results[active]);
                }
              }}
              placeholder="Type a command or search…"
              className="w-full bg-transparent py-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="shrink-0 rounded-md border border-black/[0.08] bg-black/[0.03] px-2 py-1 text-[10px] font-bold text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.05]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <PaletteResults
            groups={groups}
            results={results}
            active={active}
            setActive={setActive}
            go={go}
            query={query}
          />

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-black/[0.06] px-5 py-3 text-[11px] font-medium text-muted-foreground dark:border-white/[0.08]">
            <span><kbd className="font-bold">↑↓</kbd> navigate</span>
            <span><kbd className="font-bold">↵</kbd> open</span>
            <span><kbd className="font-bold">esc</kbd> close</span>
            <span className="ml-auto font-bold text-violet-500">ShopFlow Pulse</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandPalette;