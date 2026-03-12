import { useState, type KeyboardEvent } from "react"
import type { KanbanColumn } from "./kanban-board"
import { defaultColumns } from "./kanban-board"
import { Input } from "../primitives/input"
import { Textarea } from "../primitives/textarea"
import { Button } from "../primitives/button"
import { cn } from "../../lib/utils"
import { AlignLeft, Tag, Columns3, X } from "lucide-react"

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    todo: "To Do",
    doing: "In Arbeit",
    done: "Erledigt",
  }
  return labels[status] ?? status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: "bg-muted text-muted-foreground",
    doing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  }
  return colors[status] ?? "bg-muted text-muted-foreground"
}

function getTagColor(tag: string): string {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export interface KanbanTaskCreateData {
  title: string
  description: string
  status: string
  tags: string[]
}

export interface KanbanTaskCreateProps {
  onSubmit: (data: KanbanTaskCreateData) => void
  onCancel: () => void
  columns?: KanbanColumn[]
  availableTags?: string[]
  className?: string
}

export function KanbanTaskCreate({
  onSubmit,
  onCancel,
  columns = defaultColumns,
  availableTags = [],
  className,
}: KanbanTaskCreateProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), status, tags })
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // Tags from availableTags that haven't been added yet
  const suggestedTags = availableTags.filter((t) => !tags.includes(t))

  return (
    <div className={cn("space-y-5 p-4", className)}>
      {/* Heading */}
      <h2 className="text-lg font-semibold text-foreground leading-tight">
        Neuen Task erstellen
      </h2>

      {/* Title */}
      <div className="space-y-1.5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel eingeben..."
          autoFocus
        />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
          <Columns3 className="h-3.5 w-3.5" />
          Status
        </div>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setStatus(col.id)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-all",
                getStatusColor(col.id),
                status === col.id
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : "opacity-50 hover:opacity-75"
              )}
            >
              {getStatusLabel(col.id)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
          <AlignLeft className="h-3.5 w-3.5" />
          Beschreibung
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung hinzufuegen..."
          rows={3}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
          <Tag className="h-3.5 w-3.5" />
          Tags
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1",
                  getTagColor(tag)
                )}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Tag eingeben und Enter druecken..."
        />
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium opacity-40 hover:opacity-70 transition-opacity",
                  getTagColor(tag)
                )}
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex-1"
        >
          Task erstellen
        </Button>
      </div>
    </div>
  )
}
