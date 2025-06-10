import { useEffect } from "react"
import { echo } from "@/lib/echo"
import type { Ticket } from "@/types/ticket"

export const useTicketRealtime = (ticketId: string, onUpdate: (ticket: Ticket) => void) => {
    useEffect(() => {
      if (!ticketId) return
    
      console.log(`✅ Subscribing to tickets.${ticketId}`)
    
      const channel = echo.channel(`tickets.${ticketId}`)
    
      channel.listen('.ticket.updated', (data: Ticket ) => {
        console.log("📬 Event received:", data)
        onUpdate(data)
      })
    
      return () => {
        console.log(`⛔ Leaving tickets.${ticketId}`)
        echo.leave(`tickets.${ticketId}`)
      }
    }, [ticketId, onUpdate])
}
