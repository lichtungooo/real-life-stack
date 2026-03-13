"use client"

import { cn } from "@/lib/utils"

interface GroupOption {
  id: string
  name: string
}

interface GroupWidgetProps {
  value: string
  onChange: (value: string) => void
  label: string
  options: GroupOption[]
  required?: boolean
}

export function GroupWidget({
  value,
  onChange,
  label,
  options,
  required,
}: GroupWidgetProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              value === option.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  )
}
