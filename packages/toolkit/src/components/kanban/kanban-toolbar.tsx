import { useState, useEffect, useMemo } from "react"
import type { Item, User, Relation } from "@real-life-stack/data-interface"
import { Button } from "../primitives/button"
import { Input } from "../primitives/input"
import { Separator } from "../primitives/separator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../primitives/dropdown-menu"
import { Plus, CheckSquare, User as UserIcon, Users, Search, Tag, Settings } from "lucide-react"
import { cn } from "../../lib/utils"

export interface KanbanFilter {
  searchText: string
  assignedTo: string | null
  myTasksOnly: boolean
  tags: string[]
}

export interface KanbanToolbarProps {
  items: Item[]
  users?: User[]
  currentUserId?: string
  availableTags?: string[]
  onFilterChange?: (filter: KanbanFilter) => void
  onCreateItem?: () => void
  onMultiSelectChange?: (enabled: boolean) => void
  onEditColumns?: () => void
  className?: string
}

function getAssigneeIds(item: Item): string[] {
  return (item.relations ?? [])
    .filter((r: Relation) => r.predicate === "assignedTo")
    .map((r: Relation) => r.target.replace(/^global:/, ""))
}

export function applyKanbanFilter(
  items: Item[],
  filter: KanbanFilter,
  currentUserId?: string
): Item[] {
  return items.filter((item) => {
    // Search text
    if (filter.searchText) {
      const q = filter.searchText.toLowerCase()
      const title = String(item.data.title ?? "").toLowerCase()
      const description = String(item.data.description ?? "").toLowerCase()
      if (!title.includes(q) && !description.includes(q)) return false
    }

    // My tasks only
    if (filter.myTasksOnly && currentUserId) {
      const assignees = getAssigneeIds(item)
      if (!assignees.includes(currentUserId)) return false
    }

    // Assigned to specific user
    if (filter.assignedTo) {
      const assignees = getAssigneeIds(item)
      if (!assignees.includes(filter.assignedTo)) return false
    }

    // Tags (AND logic)
    if (filter.tags.length > 0) {
      const itemTags = (item.data.tags as string[]) ?? []
      if (!filter.tags.every((t) => itemTags.includes(t))) return false
    }

    return true
  })
}

export function KanbanToolbar({
  items,
  users,
  currentUserId,
  availableTags,
  onFilterChange,
  onCreateItem,
  onMultiSelectChange,
  onEditColumns,
  className,
}: KanbanToolbarProps) {
  const [searchText, setSearchText] = useState("")
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [multiSelect, setMultiSelect] = useState(false)

  // Derive tags from items if not provided
  const tags = useMemo(() => {
    if (availableTags) return availableTags
    const tagSet = new Set<string>()
    for (const item of items) {
      for (const tag of (item.data.tags as string[]) ?? []) {
        tagSet.add(tag)
      }
    }
    return [...tagSet].sort()
  }, [items, availableTags])

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange?.({ searchText, assignedTo, myTasksOnly, tags: selectedTags })
  }, [searchText, assignedTo, myTasksOnly, selectedTags, onFilterChange])

  const handleMyTasksToggle = () => {
    if (myTasksOnly) {
      setMyTasksOnly(false)
    } else {
      setMyTasksOnly(true)
      setAssignedTo(null)
    }
  }

  const handleUserToggle = (userId: string) => {
    if (assignedTo === userId) {
      setAssignedTo(null)
    } else {
      setAssignedTo(userId)
      setMyTasksOnly(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleMultiSelectToggle = () => {
    const next = !multiSelect
    setMultiSelect(next)
    onMultiSelectChange?.(next)
  }

  const hasActiveFilters = searchText || assignedTo || myTasksOnly || selectedTags.length > 0

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* New Task */}
      {onCreateItem && (
        <Button size="sm" onClick={onCreateItem}>
          <Plus className="h-4 w-4 mr-1" />
          Neuer Task
        </Button>
      )}

      {/* Multi-Select Toggle */}
      {onMultiSelectChange && (
        <Button
          size="sm"
          variant={multiSelect ? "secondary" : "outline"}
          onClick={handleMultiSelectToggle}
        >
          <CheckSquare className="h-4 w-4 mr-1" />
          Selektion
        </Button>
      )}

      {(onCreateItem || onMultiSelectChange) && (
        <Separator orientation="vertical" className="h-6" />
      )}

      {/* My Tasks */}
      {currentUserId && (
        <Button
          size="sm"
          variant={myTasksOnly ? "secondary" : "outline"}
          onClick={handleMyTasksToggle}
        >
          <UserIcon className="h-4 w-4 mr-1" />
          Meine Tasks
        </Button>
      )}

      {/* User Dropdown */}
      {users && users.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant={assignedTo ? "secondary" : "outline"}>
              <Users className="h-4 w-4 mr-1" />
              {assignedTo
                ? users.find((u) => u.id === assignedTo)?.displayName ?? "User"
                : "User"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Zugewiesen an</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map((user) => (
              <DropdownMenuCheckboxItem
                key={user.id}
                checked={assignedTo === user.id}
                onCheckedChange={() => handleUserToggle(user.id)}
              >
                {user.displayName ?? user.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-[150px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Suchen..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="h-8 pl-7"
        />
      </div>

      {/* Tags Dropdown */}
      {tags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant={selectedTags.length > 0 ? "secondary" : "outline"}>
              <Tag className="h-4 w-4 mr-1" />
              Tags
              {selectedTags.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 rounded-full px-1.5">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tags filtern</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagToggle(tag)}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Right-aligned group: reset + settings */}
      <div className="ml-auto flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchText("")
              setAssignedTo(null)
              setMyTasksOnly(false)
              setSelectedTags([])
            }}
          >
            Filter zurücksetzen
          </Button>
        )}

        {onEditColumns && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditColumns}>
                Spalten bearbeiten
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
