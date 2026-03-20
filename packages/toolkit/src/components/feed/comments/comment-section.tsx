"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useComments } from "@/hooks/use-comments"
import type { CommentWithAuthor } from "@/hooks/use-comments"
import { CommentInput, type CommentQuote } from "./comment-input"
import { CommentThread } from "./comment-thread"

export interface CommentSectionProps {
  /** ID of the item to show comments for. */
  itemId: string
  /** Placeholder text for the input. Default: "Kommentar schreiben..." */
  placeholder?: string
  /** Slot builder for ReactionBar per comment. */
  renderReactions?: (itemId: string) => React.ReactNode
  /** Hide the built-in input. Use this when placing CommentInput separately. */
  hideInput?: boolean
  /** Callback exposing reply state, so the consumer can render a separate CommentInput. */
  onReplyChange?: (replyTo: CommentQuote | null, submit: (text: string) => Promise<void>, cancel: () => void) => void
  /** Additional CSS classes for the comment list. */
  className?: string
}

/**
 * Complete comment section: comment list + input.
 * The list and the input are rendered as siblings so the consumer can place
 * them in separate layout zones (e.g. input outside a scroll container).
 *
 * The consumer controls layout. Use hideInput + onReplyChange to render
 * the CommentInput separately (e.g. outside a scroll container).
 */
export function CommentSection({
  itemId,
  placeholder,
  renderReactions,
  hideInput = false,
  onReplyChange,
  className,
}: CommentSectionProps) {
  const { comments, allComments, canComment, createComment } = useComments(itemId)
  const [replyTo, setReplyTo] = useState<CommentQuote | null>(null)
  const [replyToFirstLevel, setReplyToFirstLevel] = useState<string | null>(null)

  // Build replies per first-level comment from allComments
  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentWithAuthor[]>()
    for (const c of allComments) {
      if (c.type !== "comment") continue
      const replyToId = (c.data as { replyTo?: string }).replyTo
      if (!replyToId) continue

      const list = map.get(replyToId) ?? []
      list.push({
        item: c,
        authorName: c.createdBy,
        authorAvatar: undefined,
        replyCount: 0,
      })
      map.set(replyToId, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime())
    }
    return map
  }, [allComments])

  const handleReply = useCallback((comment: CommentWithAuthor) => {
    const data = comment.item.data as { content: string; replyTo?: string }
    const isSecondLevel = !!data.replyTo

    setReplyTo({
      id: comment.item.id,
      authorName: comment.authorName,
      text: (data.content ?? "").slice(0, 80),
    })

    setReplyToFirstLevel(isSecondLevel ? data.replyTo! : comment.item.id)
  }, [])

  const handleSubmit = useCallback(async (text: string) => {
    if (replyTo && replyToFirstLevel) {
      const replyToComment = replyTo.id !== replyToFirstLevel ? replyTo.id : undefined
      await createComment(text, replyToFirstLevel, replyToComment)
    } else {
      await createComment(text)
    }
    setReplyTo(null)
    setReplyToFirstLevel(null)
  }, [createComment, replyTo, replyToFirstLevel])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
    setReplyToFirstLevel(null)
  }, [])

  // Notify consumer of reply state for external input rendering
  useEffect(() => {
    onReplyChange?.(replyTo, handleSubmit, handleCancelReply)
  }, [replyTo, handleSubmit, handleCancelReply, onReplyChange])

  return (
    <>
      {/* Comment list */}
      {comments.length > 0 && (
        <div className={cn("space-y-4 p-4", className)}>
          {comments.map((comment) => (
            <CommentThread
              key={comment.item.id}
              comment={comment}
              replies={repliesByParent.get(comment.item.id) ?? []}
              onReply={canComment ? handleReply : undefined}
              canReply={canComment}
              renderReactions={renderReactions}
            />
          ))}
        </div>
      )}

      {/* Built-in input (can be hidden when consumer renders it separately) */}
      {canComment && !hideInput && (
        <CommentInput
          onSubmit={handleSubmit}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          placeholder={placeholder}
        />
      )}
    </>
  )
}
