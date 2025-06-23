import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  user: { name: string };
  content: string;
  created_at: string;
  internal: boolean;
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-4 p-4 rounded-lg",
            message.internal
              ? "bg-yellow-50 border border-yellow-100"
              : "bg-white border border-gray-100 shadow-sm",
          )}
        >
          <UserAvatar name={message.user.name} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">
                {message.user.name}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(message.created_at)}
              </span>
              {message.internal && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  Internal
                </Badge>
              )}
            </div>

            <div className="text-gray-700 whitespace-pre-wrap">
              {message.content}
            </div>

            {message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="truncate max-w-[200px]">
                      {attachment.name}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
