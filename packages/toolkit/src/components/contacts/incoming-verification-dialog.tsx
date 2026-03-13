"use client"

import { useState } from "react"
import { UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/primitives/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog"

export interface IncomingVerificationDialogProps {
  open: boolean
  fromId: string
  fromName?: string
  onConfirm: () => Promise<void>
  onReject: () => void
}

export function IncomingVerificationDialog({
  open,
  fromId,
  fromName,
  onConfirm,
  onReject,
}: IncomingVerificationDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const name = fromName ?? `User-${fromId.slice(-6)}`

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
    } catch (e) {
      console.error("Counter-verification failed:", e)
    }
    setConfirming(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onReject() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Stehst du vor dieser Person?</DialogTitle>
          <DialogDescription className="text-center">
            Bestätige nur, wenn du diese Person persönlich kennst.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground font-mono max-w-[280px] truncate">
              {fromId}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReject}
          >
            Ablehnen
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bestätigen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
