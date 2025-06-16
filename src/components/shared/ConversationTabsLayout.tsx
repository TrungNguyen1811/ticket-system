import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronRight, Plus, User } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "../ui/breadcrumb";
import { ConversationTabsContext, ConversationTab } from "@/contexts/ConversationTabsContextType";

export default function ConversationTabsLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const path = useLocation().pathname;

  const [tabs, setTabs] = useState<ConversationTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Breadcrumb items
  const activeTab = tabs.find(t => t.id === activeId);
  const breadcrumbItems = [
    { label: "Conversations", href: "/communication/conversation" },
    ...(activeTab
      ? [
          {
            label: activeTab.type === "client" ? "Client Detail" : "Conversation Detail",
            href: path,
          },
        ]
      : []),
  ];

  // Khi route thay đổi, mở tab tương ứng
  useEffect(() => {
    if (id && !tabs.find(t => t.id === id)) {
      // fetch title nếu cần, ở đây demo subject
      setTabs(prev => [
        ...prev,
        { id, subject: `Conv ${id}`, type: path.includes("client") ? "client" : "conversation" },
      ]);
    }
    setActiveId(id || null);
  }, [id, path]);

  const closeTab = (tabId: string) => {
    const remaining = tabs.filter(t => t.id !== tabId);
    setTabs(remaining);

    if (tabId === activeId) {
      // chuyển về tab bên trái
      const next = remaining[remaining.length - 1];
      if (next) navigate(`/communication/conversation/${next.id}`);
      else navigate(`/communication/conversation`);
    }
  };

  // Hàm này nên truyền xuống Conversation/Client list để add tab khi click
  const addTab = (tab: ConversationTab) => {
    setTabs(prev => {
      if (prev.find(t => t.id === tab.id)) return prev;
      return [...prev, tab];
    });
    setActiveId(tab.id);
    navigate(`/communication/conversation/${tab.id}`);
  };

  return (
    <ConversationTabsContext.Provider value={{ addTab }}>
      <div>
        {/* Tabs bar */}
        {tabs.length > 0 && (
          <div className="flex space-x-2 border-b bg-muted px-4 py-2">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`px-3 py-1 rounded-t-md cursor-pointer flex items-center gap-1 ${
                  tab.id === activeId ? 'bg-white border font-semibold' : 'text-muted-foreground'
                }`}
                onClick={() => navigate(`/communication/conversation/${tab.id}`)}
              >
                {tab.type === "client" ? <User className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="truncate max-w-[120px]">{tab.subject}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 text-gray-400 hover:text-red-500"
                  title="Close"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        {tabs.length > 0 && (
          <div className="p-4">
            <nav className="flex items-center text-sm text-muted-foreground gap-1">
              {breadcrumbItems.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-4 w-4" />}
                  <BreadcrumbLink href={item.href} className="hover:underline">
                    {item.label}
                  </BreadcrumbLink>
                </span>
              ))}
            </nav>
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>
    </ConversationTabsContext.Provider>
  );
}
