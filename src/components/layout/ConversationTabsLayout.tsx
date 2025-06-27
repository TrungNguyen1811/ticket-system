import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight, MessageSquare, User } from "lucide-react";
import { BreadcrumbLink } from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import {
  ConversationTab,
  useConversationTabsStore,
} from "@/hooks/utils/useConversationTabsStore";
import { ticketService } from "@/services/ticket.service";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { Client } from "@/types/user";

export default function ConversationTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const path = useLocation().pathname;

  const isClient = path.includes("clients");
  const type = isClient ? "client" : "conversation";
  const tabId = id ? `${type}_${id}` : null;

  let dataQuery: any;

  if (type === "conversation") {
    dataQuery = useQuery({
      queryKey: ["ticket", id],
      queryFn: () => ticketService.getTicket(id || ""),
      enabled: !!id,
    });
  } else {
    dataQuery = useQuery({
      queryKey: ["client", id],
      queryFn: () =>
        userService.getClients({}).then((res) => {
          const list = res.data?.data ?? res.data; // handle both structures
          return list.find((client: Client) => client.id === id);
        }),
      enabled: !!id,
    });
  }

  const { tabs, activeId, addTab, closeTab, setActiveId, clearTabs } =
    useConversationTabsStore();

  // Add tab when ticket data loaded
  useEffect(() => {
    if (!tabId || !dataQuery.data?.data) return;

    const subject = (() => {
      if (!dataQuery.data) return "";
      if (type === "client") return dataQuery.data.name;
      return dataQuery.data.data?.title;
    })();

    addTab({ id: tabId, subject, type });
  }, [tabId, dataQuery.data?.data]);

  console.log("tabs before addTab:", tabs);

  // Clear tabs when leaving conversation/client pages
  useEffect(() => {
    if (
      !path.startsWith("/communication/conversation") &&
      !path.startsWith("/communication/clients")
    ) {
      clearTabs();
    }
  }, [path]);

  const handleTabClick = (tab: ConversationTab) => {
    const [type, rawId] = tab.id.split("_");
    const href =
      type === "client"
        ? `/communication/clients/${rawId}`
        : `/communication/conversation/${rawId}`;
    navigate(href);
    setActiveId(tab.id);
  };

  const handleCloseTab = (tabId: string) => {
    closeTab(tabId);
    if (activeId === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      const next = remainingTabs.at(-1);
      if (next) {
        handleTabClick(next);
      } else {
        navigate("/communication/conversation");
        setActiveId(null);
      }
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeId);
  const breadcrumbItems = [
    { label: "Conversations", href: "/communication/conversation" },
    ...(activeTab
      ? [
          {
            label:
              activeTab.type === "client"
                ? "Client Detail"
                : "Conversation Detail",
            href:
              activeTab.type === "client"
                ? `/communication/clients/${activeTab.id.split("_")[1]}`
                : `/communication/conversation/${activeTab.id.split("_")[1]}`,
          },
        ]
      : []),
  ];

  return (
    <div className="h-screen flex flex-col">
      {tabs.length > 0 && (
        <div className="flex-none flex space-x-2 border-b bg-muted py-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`px-3 py-1 rounded-t-md cursor-pointer flex items-center gap-1 ml-2 ${
                tab.id === activeId
                  ? "bg-white border"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.type === "client" ? (
                <User className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              <span className="truncate max-w-[120px]">{tab.subject}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
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

      {tabs.length > 0 && breadcrumbItems.length > 1 && (
        <div className="flex-none p-4">
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

      <Separator />
      <div className="flex-1">{children}</div>
    </div>
  );
}
