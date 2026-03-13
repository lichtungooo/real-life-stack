"use client"

import * as React from "react"
import { Globe, MapPin } from "lucide-react"
import { Input } from "@/components/primitives/input"
import { Button } from "@/components/primitives/button"

interface LocationData {
  address?: string
  link?: string
  isOnline?: boolean
  position?: { lat: number; lng: number }
}

interface LocationWidgetProps {
  value: LocationData
  onChange: (value: LocationData) => void
  label: string
  renderMap?: (props: {
    position: { lat: number; lng: number } | null
    onPositionChange: (pos: { lat: number; lng: number }) => void
    onConfirm: () => void
  }) => React.ReactNode
}

export function LocationWidget({
  value,
  onChange,
  label,
  renderMap,
}: LocationWidgetProps) {
  const isOnline = value.isOnline ?? false

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {/* Online/Offline Toggle */}
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant={!isOnline ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...value, isOnline: false })}
          className="gap-1.5"
        >
          <MapPin className="h-3.5 w-3.5" />
          Vor Ort
        </Button>
        <Button
          type="button"
          variant={isOnline ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...value, isOnline: true })}
          className="gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          Online
        </Button>
      </div>
      {/* Input field */}
      {isOnline ? (
        <Input
          value={value.link || ""}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
          placeholder="Meeting-Link (z.B. https://meet.example.com/...)"
          type="url"
          className="text-sm"
        />
      ) : (
        <>
          <Input
            value={value.address || ""}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="Adresse eingeben..."
            className="text-sm"
          />
          {/* Map slot */}
          {renderMap && (
            <div className="mt-2 overflow-hidden rounded-md border">
              {renderMap({
                position: value.position || null,
                onPositionChange: (pos) =>
                  onChange({ ...value, position: pos }),
                onConfirm: () => {},
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
