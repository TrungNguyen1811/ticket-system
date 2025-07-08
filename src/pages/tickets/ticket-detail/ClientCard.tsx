import { Info, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientCardProps {
  clientName: string;
  clientEmail: string;
  ticketId: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  clientName,
  clientEmail,
  ticketId,
}) => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => userService.getClients({}),
  });

  const clientId = clients?.data?.data?.find(
    (client) => client.name === clientName,
  )?.id;

  if (isLoading) {
    return  <div className="flex flex-col items-center space-x-3 p-4"> 
    <Skeleton className="w-20 h-20 rounded-full mb-2" />
    <div className="flex flex-col items-center p-2">
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
    <div className="flex flex-row items-center justify-end mt-4 gap-4">
      <div className="flex flex-col items-center justify-end">
        <Skeleton className="h-10 w-10 rounded-full mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-center justify-end">
        <Skeleton className="h-10 w-10 rounded-full mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>;
  }

  const path = useLocation().pathname;

  return (
    <div className="">
      <div className="pt-0">
        <div className="flex flex-col items-center space-x-3 p-4">
          <UserAvatar name={clientName} size="2xl" />
          <div className="flex flex-col items-center p-2">
            <p className="text-sm font-medium text-foreground">{clientName}</p>
            <p className="text-xs text-muted-foreground">{clientEmail}</p>
          </div>
          <div className="flex flex-row items-center justify-end mt-4 gap-4">
            {path.includes("tickets") ? (
              <div className="flex flex-col items-center justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-secondary-200 h-10 w-10 hover:bg-secondary-300 hover:text-blue-600 hover:cursor-pointer group"
                >
                  <Link
                    to={`/communication/conversation/${ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                    >
                    <MessageSquare className="h-4 w-4 group-hover:scale-110" />
                  </Link>
                </Button>
                <p className="text-xs">Conversation</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="rounded-full bg-secondary-200 h-10 w-10 hover:bg-secondary-300 hover:text-blue-600 hover:cursor-pointer group"
                >
                  <Link
                    to={`/tickets/${ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                    >
                      <MessageSquare className="h-4 w-4 group-hover:scale-110" />
                    </Link>
                </Button>
                <p className="text-xs">Ticket Detail</p>
              </div>
            )}

            <div className="flex flex-col items-center justify-end">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="rounded-full bg-secondary-200 h-10 w-10 hover:bg-secondary-300 hover:text-blue-600 hover:cursor-pointer group"
              >
                <Link
                  to={`/communication/clients/${clientId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                >
                  <Info className="h-6 w-6 group-hover:scale-110" />
                </Link>
              </Button>
              <p className="text-xs">Client Profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
