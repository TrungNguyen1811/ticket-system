import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  placeholder = "Write a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button variant="outline" size="icon" type="button">
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button type="submit" size="sm" disabled={!message.trim()}>
        <Send className="h-4 w-4 mr-1" />
        Send
      </Button>
    </form>
  );
}
