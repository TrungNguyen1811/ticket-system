import { useEffect } from "react";
import { echo } from "@/lib/echo";
import type { TicketAuditLog } from "@/types/ticket";

export const useLogRealtime = (
  ticketId: string,
  onUpdate: (log: TicketAuditLog) => void,
  onDelete?: (logId: string) => void,
) => {
  useEffect(() => {
    if (!ticketId) return;

    const channel = echo.channel(`tickets.${ticketId}.logs`);

    // Listen for new logs
    channel.listen(".audit.logged", (data: TicketAuditLog) => {
      console.log("AuditLogCreated", data);
      onUpdate(data);
    });

    // Listen for deleted logs
    if (onDelete) {
      channel.listen(".audit.logged.deleted", (data: { id: string }) => {
        console.log("AuditLogDeleted", data);
        onDelete(data.id);
      });
    }

    return () => {
      console.log(`⛔ Leaving tickets.${ticketId}.logs`);
      echo.leave(`tickets.${ticketId}.logs`);
    };
  }, [ticketId, onUpdate, onDelete]);
};
