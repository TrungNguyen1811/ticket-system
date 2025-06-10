
import { useEffect } from "react"
import { usePusher } from "@/contexts/PusherContext"
import type { Ticket } from "@/types/ticket"

export function useTicketRealtime(
  ticketId: string | undefined,
  onUpdate: (ticket: Ticket) => void
) {
  const { pusher } = usePusher()

  useEffect(() => {
    if (!pusher || !ticketId) return

    const channel = pusher.subscribe(`tickets.${ticketId}`)

    const handleUpdate = (data: Ticket) => {
      onUpdate(data)
    }

    channel.bind(`tickets.${ticketId}`, handleUpdate)

    return () => {
      channel.unbind(`tickets.${ticketId}`, handleUpdate)
      pusher.unsubscribe(`tickets.${ticketId}`)
    }
  }, [pusher, ticketId, onUpdate])
}
