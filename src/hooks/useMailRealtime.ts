import { useEffect } from "react";
import { echo } from "@/lib/echo";
import { Mail } from "@/types/mail";

export const useMailRealtime = (
  ticketId: string,
  onUpdate: (mail: Mail) => void,
) => {
  useEffect(() => {
    if (!ticketId) return;

    console.log(`📧 Subscribing to tickets.${ticketId}.mails`);
    const channel = echo.channel(`tickets.${ticketId}.mails`);

    // Listen for new mails
    channel.listen(".mail.created", (data: Mail) => {
      console.log("📬 MailCreated", data);
      onUpdate(data);
    });

    return () => {
      console.log(`⛔ Leaving tickets.${ticketId}.mails`);
      echo.leave(`tickets.${ticketId}.mails`);
    };
  }, [ticketId, onUpdate]);
};
