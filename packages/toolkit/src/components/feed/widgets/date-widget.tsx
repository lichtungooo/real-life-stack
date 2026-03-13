"use client"

import { Input } from "@/components/primitives/input"
import { Button } from "@/components/primitives/button"
import { cn } from "@/lib/utils"

interface DateRange {
  start: string
  end?: string
  showEnd?: boolean
  rrule?: string
}

interface DateWidgetProps {
  value: DateRange
  onChange: (value: DateRange) => void
  label: string
}

const RECURRENCE_OPTIONS = [
  { id: "none", label: "Keine" },
  { id: "FREQ=DAILY", label: "Taeglich" },
  { id: "FREQ=WEEKLY", label: "Woechentlich" },
  { id: "FREQ=MONTHLY", label: "Monatlich" },
]

export function DateWidget({ value, onChange, label }: DateWidgetProps) {
  const showEnd = value.showEnd ?? false

  const updateField = (field: keyof DateRange, val: string | boolean) => {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="space-y-2">
        {/* Start date */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-xs text-muted-foreground">Start</span>
          <Input
            type="datetime-local"
            value={value.start}
            onChange={(e) => updateField("start", e.target.value)}
            className="text-sm"
          />
        </div>
        {/* End date toggle + input */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-xs text-muted-foreground">Ende</span>
          {showEnd ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                type="datetime-local"
                value={value.end || ""}
                onChange={(e) => updateField("end", e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({ ...value, showEnd: false, end: undefined })
                }
                className="text-xs text-muted-foreground"
              >
                Entfernen
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...value, showEnd: true })}
              className="text-xs"
            >
              Enddatum hinzufuegen
            </Button>
          )}
        </div>
        {/* Recurrence */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-xs text-muted-foreground">Wiederh.</span>
          <div className="flex flex-wrap gap-1.5">
            {RECURRENCE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => updateField("rrule", option.id)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  (value.rrule || "none") === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
