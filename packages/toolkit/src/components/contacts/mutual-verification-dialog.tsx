"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/primitives/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog"

export interface MutualVerificationDialogProps {
  open: boolean
  peerName?: string
  onDismiss: () => void
}

export function MutualVerificationDialog({
  open,
  peerName,
  onDismiss,
}: MutualVerificationDialogProps) {
  const name = peerName ?? "Kontakt"

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Gegenseitig verifiziert!</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Du und <span className="font-medium text-foreground">{name}</span> habt euch gegenseitig verifiziert.
          </p>
        </div>

        <Button className="w-full" onClick={onDismiss}>
          Fertig
        </Button>
      </DialogContent>
    </Dialog>
  )
}
