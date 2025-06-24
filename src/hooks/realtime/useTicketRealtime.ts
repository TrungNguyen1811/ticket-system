import { useEffect, useRef } from "react";
import { echo } from "@/lib/echo";
import type { Ticket } from "@/types/ticket";

export const useTicketRealtime = (
  ticketId: string,
  onUpdate: (ticket: Ticket) => void,
) => {
  const updatedFields = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ticketId) return;

    console.log(`✅ Subscribing to tickets.${ticketId}`);

    const channel = echo.channel(`tickets.${ticketId}`);

    channel.listen(".ticket.updated", (data: Ticket) => {
      console.log("📬 Event received:", data);

      // Skip if we initiated this update
      if (updatedFields.current.has(data.id)) {
        updatedFields.current.delete(data.id);
        return;
      }

      onUpdate(data);
    });

    return () => {
      console.log(`⛔ Leaving tickets.${ticketId}`);
      echo.leave(`tickets.${ticketId}`);
    };
  }, [ticketId, onUpdate]);

  return {
    markAsUpdated: (ticketId: string) => {
      updatedFields.current.add(ticketId);
    },
  };
};
