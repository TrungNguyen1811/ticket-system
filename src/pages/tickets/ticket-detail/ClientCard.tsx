import { Info, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

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
  const navigate = useNavigate();
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => userService.getClients(),
  });

  const clientId = clients?.data?.data?.find(
    (client) => client.name === clientName,
  )?.id;

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
            <div className="flex flex-col items-center justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigate(`/communication/conversation/${ticketId}`)
                }
                className="rounded-full bg-secondary-200 h-10 w-10 hover:bg-secondary-300 hover:text-blue-600 hover:cursor-pointer"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
              <p className="text-xs">Conversation</p>
            </div>
            <div className="flex flex-col items-center justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/communication/clients/${clientId}`)}
                className="rounded-full bg-secondary-200 h-10 w-10 hover:bg-secondary-300 hover:text-blue-600 hover:cursor-pointer"
              >
                <Info className="h-6 w-6" />
              </Button>
              <p className="text-xs">Client Profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
