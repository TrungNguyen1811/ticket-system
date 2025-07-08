import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/response";
import { mailService } from "@/services/mail.service";
import { Mail } from "@/types/mail";
import { useMailRealtime } from "@/hooks/mail/useMailRealtime";
import { toast } from "@/components/ui/use-toast";

interface UseMailTicketProps {
  ticketId: string;
  limit?: number;
  cursor?: string;
}

export const useMailTicket = ({
  ticketId,
  limit,
  cursor,
}: UseMailTicketProps) => {
  const [hasNewMails, setHasNewMails] = useState(false);

  const { data: mailsData, isLoading } = useQuery<
    Response<DataResponse<Mail[]>>
  >({
    queryKey: ["ticket-mails", ticketId, limit, cursor],
    queryFn: () => mailService.getMails(ticketId, { limit, cursor }),
  });

  const handleMailUpdate = useCallback(() => {
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
