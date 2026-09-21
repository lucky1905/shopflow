import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar, Topbar, CommandPalette } from '@/components/shell';
import { useKeyboardShortcut } from '@/hooks';

export interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * Pulse app shell — an "aurora" ambient-gradient workspace.
 *
 * Layered like a modern SaaS product:
 *   1. Fixed aurora backdrop (violet / fuchsia / cyan nebulae, subtle grain)
 *   2. Floating dark sidebar rail (inset, rounded, shadowed)
 *   3. Floating frosted-glass topbar capsule
 *   4. Page content on the ambient canvas
 *   5. Global Ctrl/⌘K command palette
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  useKeyboardShortcut('k', (event) => {
    event.preventDefault();
    setCommandOpen((open) => !open);
  }, { mod: true });

  return (
    <div className="relative min-h-screen bg-[#f4f3fb] text-foreground dark:bg-[#0a0817]">
      {/* ── Aurora backdrop ─────────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[8%] h-[520px] w-[520px] rounded-full bg-violet-400/30 blur-[120px] dark:bg-violet-600/25" />
        <div className="absolute -right-40 top-[12%] h-[560px] w-[560px] rounded-full bg-fuchsia-400/25 blur-[130px] dark:bg-fuchsia-600/20" />
        <div className="absolute bottom-[-12%] left-[28%] h-[500px] w-[700px] rounded-full bg-cyan-300/25 blur-[140px] dark:bg-cyan-500/15" />
        <div className="absolute right-[22%] top-[45%] h-[360px] w-[360px] rounded-full bg-amber-300/20 blur-[110px] dark:bg-amber-500/10" />
        {/* Fine grid — very low opacity so it reads as texture, not lines */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(100,80,180,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,80,180,0.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 85%)',
          }}
        />
      </div>

      {/* ── Shell ───────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenCommand={() => setCommandOpen(true)} />
          <div className="min-h-0 flex-1">{children ?? <Outlet />}</div>
        </div>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}

export default DashboardLayout;
