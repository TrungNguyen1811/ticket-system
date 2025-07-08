import { useEffect } from "react";
import { echo } from "@/lib/echo";
import type { Comment } from "@/types/comment";

export const useCommentRealtime = (
  ticketId: string,
  onUpdate: (comment: Comment) => void,
  onDelete?: (commentId: string) => void,
  lastEditedComment?: { id: string; content: string } | null,
) => {
  useEffect(() => {
    if (!ticketId) return;

    const channel = echo.channel(`tickets.${ticketId}.comments`);

    channel.listen(".comment.updated", (data: Comment) => {
      console.log("CommentUpdated", data);

      if (
        lastEditedComment &&
        lastEditedComment.id === data.id &&
        lastEditedComment.content === data.content
      ) {
        console.log("⚠️ Skipped self-update (same comment already applied)");
        return;
      }

      onUpdate(data);
    });

    channel.listen(".comment.created", (data: Comment) => {
      console.log("CommentCreated", data);
      onUpdate(data);
    });

    if (onDelete) {
      channel.listen(".comment.deleted", (data: { id: string }) => {
        console.log("CommentDeleted", data);
        onDelete(data.id);
      });
    }

    return () => {
      echo.leave(`tickets.${ticketId}.comments`);
    };
  }, [ticketId, onUpdate, onDelete, lastEditedComment]);
};
