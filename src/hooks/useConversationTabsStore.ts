import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConversationTab = {
  id: string; // ví dụ: "conversation_123"
  subject: string;
  type: "conversation" | "client";
};

interface ConversationTabsState {
  tabs: ConversationTab[];
  activeId: string | null;
  addTab: (tab: ConversationTab) => void;
  closeTab: (id: string) => void;
  setActiveId: (id: string | null) => void;
  clearTabs: () => void;
}

export const useConversationTabsStore = create<ConversationTabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeId: null,

      addTab: (tab) => {
        const exists = get().tabs.some((t) => t.id === tab.id);
        if (!exists) {
          set((state) => ({ tabs: [...state.tabs, tab] }));
        }
        set({ activeId: tab.id });
      },

      closeTab: (tabId) => {
        const newTabs = get().tabs.filter((tab) => tab.id !== tabId);
        set({ tabs: newTabs });

        if (get().activeId === tabId) {
          set({ activeId: newTabs.at(-1)?.id || null });
        }
      },

      setActiveId: (id) => set({ activeId: id }),
      clearTabs: () => set({ tabs: [], activeId: null }),
    }),
    {
      name: "conversation-tabs", // key trong localStorage
    }
  )
);
