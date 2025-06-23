import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/reponse";
import { mailService } from "@/services/mail.service";
import { Mail } from "@/types/mail";
import { useMailRealtime } from "./useMailRealtime";
import { toast } from "@/components/ui/use-toast";

interface UseMailTicketProps {
  ticketId: string;
}

export const useMailTicket = ({ ticketId }: UseMailTicketProps) => {
  const [hasNewMails, setHasNewMails] = useState(false);

  console.log("📧 useMailTicket called with ticketId:", ticketId);

  const { data: mailsData, isLoading } = useQuery<
    Response<DataResponse<Mail[]>>
  >({
    queryKey: ["ticket-mails", ticketId],
    queryFn: () => mailService.getMails(ticketId),
  });

  const handleMailUpdate = useCallback((data: Mail) => {
    console.log("📬 handleMailUpdate called with data:", data);
    setHasNewMails(true);
    toast({
      title: "New mail received",
      description: "Click 'Reload Chat' button to see the new message",
    });
  }, []);

  // Memoize the callback to prevent unnecessary re-subscriptions
  const memoizedHandleMailUpdate = useMemo(
    () => handleMailUpdate,
    [handleMailUpdate],
  );

  // Subscribe to realtime updates
  useMailRealtime(ticketId, memoizedHandleMailUpdate);

  return {
    mails: mailsData?.data.data || [],
    isLoading,
    hasNewMails,
    setHasNewMails,
  };
};
