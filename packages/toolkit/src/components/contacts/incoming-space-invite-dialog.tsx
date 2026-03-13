"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/primitives/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog"

export interface IncomingSpaceInviteDialogProps {
  open: boolean
  spaceName: string
  inviterName?: string
  onOpen: () => void
  onDismiss: () => void
}

export function IncomingSpaceInviteDialog({
  open,
  spaceName,
  inviterName,
  onOpen,
  onDismiss,
}: IncomingSpaceInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Neue Einladung</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{inviterName ?? "Jemand"}</span>
            {" hat dich in "}
            <span className="font-medium text-foreground">{spaceName}</span>
            {" eingeladen."}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Schließen
          </Button>
          <Button className="flex-1" onClick={onOpen}>
            Öffnen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
