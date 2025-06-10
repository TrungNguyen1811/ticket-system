import { useEffect } from "react"
import { echo } from "@/lib/echo"
import type { Comment } from "@/types/comment"

export const useCommentRealtime = (ticketId: string, onUpdate: (comment: Comment) => void) => {
  useEffect(() => {
    if (!ticketId) return

    const channel = echo.channel(`tickets.${ticketId}.comments`)

    channel.listen('.comment.created', (data: Comment) => {
      console.log("CommentCreated", data)
      onUpdate(data)
    })

    return () => {
      echo.leave(`tickets.${ticketId}.comments`)
    }
  }, [ticketId, onUpdate])
}
