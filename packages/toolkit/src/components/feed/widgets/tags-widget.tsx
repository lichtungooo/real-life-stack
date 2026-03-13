"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Input } from "@/components/primitives/input"
import { cn } from "@/lib/utils"

interface TagsWidgetProps {
  value: string[]
  onChange: (value: string[]) => void
  label: string
  suggestions?: string[] | ((query: string) => Promise<string[]>)
}

export function TagsWidget({
  value,
  onChange,
  label,
  suggestions,
}: TagsWidgetProps) {
  const [query, setQuery] = React.useState("")
  const [filtered, setFiltered] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!query.trim()) {
      setFiltered([])
      return
    }

    if (Array.isArray(suggestions)) {
      setFiltered(
        suggestions.filter(
          (s) =>
            s.toLowerCase().includes(query.toLowerCase()) &&
            !value.includes(s),
        ),
      )
    } else if (typeof suggestions === "function") {
      let cancelled = false
      suggestions(query).then((results) => {
        if (!cancelled) {
          setFiltered(results.filter((s) => !value.includes(s)))
        }
      })
      return () => {
        cancelled = true
      }
    }
  }, [query, suggestions, value])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setQuery("")
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (filtered.length > 0) {
        addTag(filtered[0])
      } else if (query.trim()) {
        addTag(query)
      }
    }
    if (e.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="space-y-1" ref={wrapperRef}>
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tag hinzufuegen..."
          className="text-sm"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            {filtered.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
