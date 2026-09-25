import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { COPILOT_STARTERS } from '../constants';
import type { AIView, CopilotMessage, ForecastRange } from '../types';

export type RestockDecision = 'accepted' | 'snoozed' | 'dismissed';

interface AIWorkspaceState {
  activeView: AIView;
  forecastRange: ForecastRange;
  acknowledgedAlerts: string[];
  restockDecisions: Record<string, RestockDecision>;
  messages: CopilotMessage[];
  setActiveView: (view: AIView) => void;
  setForecastRange: (range: ForecastRange) => void;
  acknowledgeAlert: (id: string) => void;
  unacknowledgeAlert: (id: string) => void;
  decideRestock: (id: string, decision: RestockDecision) => void;
  addMessage: (message: CopilotMessage) => void;
  clearConversation: () => void;
}

const welcomeMessage: CopilotMessage = {
  id: 'copilot-welcome',
  role: 'assistant',
  content:
    "I’m ready to help you run a healthier store. Ask about demand, margins, customers, or what to reorder next.",
  timestamp: new Date().toISOString(),
  suggestions: [...COPILOT_STARTERS],
};

export const useAIWorkspaceStore = create<AIWorkspaceState>()(
  persist(
    (set) => ({
      activeView: 'overview',
      forecastRange: '30D',
      acknowledgedAlerts: [],
      restockDecisions: {},
      messages: [welcomeMessage],
      setActiveView: (activeView) => set({ activeView }),
      setForecastRange: (forecastRange) => set({ forecastRange }),
      acknowledgeAlert: (id) =>
        set((state) => ({
          acknowledgedAlerts: state.acknowledgedAlerts.includes(id)
            ? state.acknowledgedAlerts
            : [...state.acknowledgedAlerts, id],
        })),
      unacknowledgeAlert: (id) =>
        set((state) => ({
          acknowledgedAlerts: state.acknowledgedAlerts.filter((alertId) => alertId !== id),
        })),
      decideRestock: (id, decision) =>
        set((state) => ({ restockDecisions: { ...state.restockDecisions, [id]: decision } })),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clearConversation: () => set({ messages: [welcomeMessage] }),
    }),
    {
      name: 'shopflow-ai-workspace',
      partialize: (state) => ({
        acknowledgedAlerts: state.acknowledgedAlerts,
        restockDecisions: state.restockDecisions,
        messages: state.messages,
      }),
    },
  ),
);
