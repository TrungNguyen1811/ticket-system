import { useEffect } from "react"
import { echo } from "@/lib/echo"
import type { TicketAuditLog } from "@/types/ticket"

export const useLogRealtime = (ticketId: string, onUpdate: (log: TicketAuditLog) => void) => {
  useEffect(() => {
    if (!ticketId) return

    const channel = echo.channel(`tickets.${ticketId}.logs`)

    channel.listen('.audit.logged', (data: TicketAuditLog) => {
      console.log("AuditLogCreated", data)
      onUpdate(data)
    })

    return () => {
      echo.leave(`tickets.${ticketId}.logs`)
    }
  }, [ticketId, onUpdate])
}
