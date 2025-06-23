import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  messages: any[];
  onSendMessage: (message: string, isInternal: boolean) => void;
}

export function ChatView({ messages, onSendMessage }: ChatViewProps) {
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");

  const filteredMessages = messages.filter(
    (message) => message.internal === (activeTab === "internal"),
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="flex-none p-4 border-b border-gray-200 bg-white">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "public" | "internal")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="public">Public Messages</TabsTrigger>
            <TabsTrigger value="internal">Internal Notes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={filteredMessages} />
      </div>

      {/* Message input */}
      <div className="flex-none p-4 border-t border-gray-200 bg-white">
        <MessageInput
          onSend={(message) => onSendMessage(message, activeTab === "internal")}
          placeholder={
            activeTab === "internal"
              ? "Write an internal note..."
              : "Write a message..."
          }
        />
      </div>
    </div>
  );
}
