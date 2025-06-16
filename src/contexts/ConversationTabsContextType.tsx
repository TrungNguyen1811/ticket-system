import { createContext, useContext } from "react";

export interface ConversationTab {
  id: string;
  subject: string;
  type: "conversation" | "client";
}

export interface ConversationTabsContextType {
  addTab: (tab: ConversationTab) => void;
}

export const ConversationTabsContext = createContext<ConversationTabsContextType | undefined>(undefined);

export function useConversationTabs() {
  const ctx = useContext(ConversationTabsContext);
  if (!ctx) throw new Error("useConversationTabs must be used within ConversationTabsProvider");
  return ctx;
}