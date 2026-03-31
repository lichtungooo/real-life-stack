"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar"
import { Button } from "@/components/primitives/button"
import { cn } from "@/lib/utils"

export interface FeedComposerTriggerProps {
  /** Placeholder text. Default: "Was gibt's Neues?" */
  placeholder?: string
  /** Current user display name. */
  userName?: string
  /** Current user avatar URL. */
  userAvatar?: string
  /** Content to render inside the fullscreen modal. */
  children: (props: { onClose: () => void; initialText?: string }) => React.ReactNode
  /** Additional CSS classes for the trigger card. */
  className?: string
}

function EscapeHandler({ onEscape }: { onEscape: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onEscape() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onEscape])
  return null
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

/**
 * Feed post creation trigger that opens a fullscreen modal.
 * The trigger looks like a text input field. On click, the modal
 * fades in with the ContentComposer inside, auto-focused on the
 * text field so the user can start typing immediately.
 */
export function FeedComposerTrigger({
  placeholder = "Was gibt's Neues?",
  userName,
  userAvatar,
  children,
  className,
}: FeedComposerTriggerProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [initialText, setInitialText] = useState<string | undefined>()
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleOpen = useCallback((text?: string) => {
    setInitialText(text)
    setOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setOpen(false)
      setInitialText(undefined)
    }, 200)
  }, [])

  return (
    <>
      {/* Trigger card — looks like a text input */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => handleOpen()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleOpen()
          } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Printable character — open composer with that character as initial text
            e.preventDefault()
            handleOpen(e.key)
          }
        }}
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-card p-3 cursor-pointer",
          "hover:border-primary/30 hover:shadow-sm transition-all",
          className
        )}
      >
        {userName && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        )}
        <span className="text-sm text-muted-foreground flex-1">{placeholder}</span>
      </div>

      {/* Fullscreen modal with fade-in — Escape to close */}
      {open && <EscapeHandler onEscape={handleClose} />}
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background transition-opacity duration-200 ease-out",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Close button */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content wrapper with max width, centered */}
          <div className="mx-auto max-w-3xl h-full overflow-y-auto">
            {children({ onClose: handleClose, initialText })}
          </div>
        </div>
      )}
    </>
  )
}
