import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Paperclip, Send, MoreHorizontal, Plus, Search, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import ClientDetail from "./ClientDetail";


interface mockConversation {
    id: string
    title: string
    status: string
    overdue: boolean
    assignee: { name: string }
    requester: { name: string; email: string }
    tags: string[]
    priority: string
    followers: { name: string }[]
    comments: {
        id: number
        user: { name: string }
        content: string
    }[] 
}

const mockConversation = {
  id: "5",
  title: "SAMPLE TICKET: Do I put it together",
  status: "Open",
  overdue: true,
  assignee: { name: "Support/Trung Nguyen" },
  requester: { name: "Soobin Do", email: "soobin.do@example.com" },
  tags: ["delivery", "sample_ticket"],
  priority: "Normal",
  followers: [],
  comments: [
    {
      id: 1,
      user: { name: "Soobin Do" },
      content: `Hey there, I've been browsing your site and I keep seeing this term "Flat Pack Delivery". ...`,
      created_at: "2024-06-10T01:57:00Z",
      internal: false,
      attachments: [],
    },
    {
      id: 2,
      user: { name: "Trung Nguyen" },
      content: "okok",
      created_at: "2024-06-10T02:28:00Z",
      internal: true,
      attachments: [],
    },
    {
      id: 3,
      user: { name: "Trung Nguyen" },
      content: "add new file attachment",
      created_at: "2024-06-10T02:29:00Z",
      internal: true,
      attachments: [
        {
          id: "a1",
          name: "Screenshot from 2024-06-10.png",
          url: "#",
        },
      ],
    },
  ],
};

export default function ConversationDetail( { id }: { id: string } ) {
  const { title, status, overdue, assignee, requester, tags, priority, comments } = mockConversation;
  const [openConversations, setOpenConversations] = useState<mockConversation[]>([mockConversation])
  const [conversation, setConversation] = useState<mockConversation | null>(null);

  useEffect(() => {
    setConversation(mockConversation);
  }, [id]);

  return (
    <div className="flex flex-col gap-4">
        {/* {tabs conversations} */}


        <div className="flex flex-col md:flex-row gap-4 bg-[#f6f8fa] min-h-screen mt-4">
        {/* Sidebar */}
        <aside className="w-full md:w-[320px] bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
            <div>
            <div className="font-semibold text-gray-700 mb-2">Requester</div>
            <div className="flex items-center gap-3">
                <UserAvatar name={requester.name} size="sm" />
                <div>
                <div className="font-medium">{requester.name}</div>
                <div className="text-xs text-gray-500">{requester.email}</div>
                </div>
            </div>
            </div>
            <div>
            <div className="font-semibold text-gray-700 mb-2">Assignee</div>
            <div className="flex items-center gap-2">
                <UserAvatar name={assignee.name} size="sm" />
                <span className="text-sm">{assignee.name}</span>
            </div>
            </div>
            {/* <div> */}
            {/* <div className="font-semibold text-gray-700 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
            </div>
            </div>
            <div>
            <div className="font-semibold text-gray-700 mb-2">Priority</div>
            <Badge variant="outline" className="text-xs">{priority}</Badge>
            </div> */}
            <div>
            <div className="font-semibold text-gray-700 mb-2">Status</div>
            <Badge variant={overdue ? "destructive" : "default"} className="text-xs">
                {status} {overdue && <span className="ml-1">+8m</span>}
            </Badge>
            </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">{title}</span>
                <Badge variant={overdue ? "destructive" : "default"} className="ml-2">
                {status} {overdue && <span className="ml-1">+8m</span>}
                </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>Requester: <span className="font-medium text-gray-700">{requester.name}</span></span>
                <span>Assignee: <span className="font-medium text-gray-700">{assignee.name}</span></span>
                <span>Priority: <span className="font-medium text-gray-700">{priority}</span></span>
                {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
            </div>
            </div>

            {/* Conversation history */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {comments.map((c) => (
                <div
                key={c.id}
                className={`flex gap-3 items-start ${
                    c.internal
                    ? "bg-[#fff7e6] border-l-4 border-yellow-400"
                    : "bg-white"
                } rounded-md p-4 shadow-sm`}
                >
                <UserAvatar name={c.user.name} size="sm" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                    <span className="font-medium">{c.user.name}</span>
                    <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                    {c.internal && (
                        <Badge variant="secondary" className="ml-2 bg-yellow-200 text-yellow-800 border-yellow-300">
                        Internal
                        </Badge>
                    )}
                    </div>
                    <div className="mt-1 text-sm">{c.content}</div>
                    {c.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {c.attachments.map((a) => (
                        <a
                            key={a.id}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs hover:underline"
                        >
                            <Paperclip className="h-3 w-3" />
                            {a.name}
                        </a>
                        ))}
                    </div>
                    )}
                </div>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </div>
            ))}
            </div>

            {/* Reply form */}
            <form className="bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-2">
            <Input placeholder="Write a reply..." className="flex-1" />
            <Button variant="outline" size="icon" type="button">
                <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" size="sm">
                <Send className="h-4 w-4 mr-1" />
                Send
            </Button>
            </form>
        </main>

        {/* {client information} */}
        <aside className="w-full md:w-[320px] bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <UserAvatar name={requester.name} size="lg" />
                    <div className="flex flex-col">
                        <div className="font-semibold text-gray-700">{requester.name}</div> 
                        <div className="text-xs text-gray-500">{requester.email}</div>
                    </div>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-col gap-2">
                    <div className="font-semibold text-gray-700 mb-2">Attachments</div>
                    <div className="flex flex-col gap-2">
                        {/*  */}
                    </div>
                </div>
            </div>
        </aside>
        </div>
    </div>
  );
}