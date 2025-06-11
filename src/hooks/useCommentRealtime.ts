import { useEffect } from "react"
import { echo } from "@/lib/echo"
import type { Comment } from "@/types/comment"

export const useCommentRealtime = (
  ticketId: string, 
  onUpdate: (comment: Comment) => void,
  onDelete?: (commentId: string) => void
) => {
  useEffect(() => {
    if (!ticketId) return

    const channel = echo.channel(`tickets.${ticketId}.comments`)

    channel.listen('.comment.created', (data: Comment) => {
      console.log("CommentCreated", data)
      onUpdate(data)
    })

    channel.listen('.comment.updated', (data: Comment) => {
      console.log("CommentUpdated", data)
      onUpdate(data)
    })

    if (onDelete) {
      channel.listen('.comment.deleted', (data: { id: string }) => {
        console.log("CommentDeleted", data)
        onDelete(data.id)
      })
    }

    return () => {
      echo.leave(`tickets.${ticketId}.comments`)
    }
  }, [ticketId, onUpdate, onDelete])
}
