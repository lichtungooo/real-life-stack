# FeedView — Requirements Specification

## 1. Overview

The **FeedView** is the primary content stream of the app. It displays posts, events, and other content items in reverse chronological order. Users can create new content, react to items, and comment on them.

### Current state

- **Prototype**: Rich PostCards (images, reactions, location/time links, type badges), animated with Framer Motion, sort by time or distance. Create flow via SmartPostWidget → full-screen modal.
- **Reference App**: Minimal FeedView with StatCards, ActionCards, SimplePostWidget, and basic PostCards showing only text. Interactions log to console.

### Design principles

- **Item-type agnostic** — the feed renders any item that has content-relevant fields (`content`, `title`, `start`, etc.). The item type determines which visual elements appear (type badge, date, location), not which component is used.
- **Composable** — the feed combines existing toolkit components (PostCard, ReactionBar, CommentSection, ContentComposer) rather than building new ones.
- **Connector-independent** — all data comes via hooks, no direct connector access.
- **No Framer Motion** — CSS transitions only, consistent with the rest of the toolkit.

---

## 2. Feed Structure

### Layout

```
FeedView
├── FeedHeader (optional stats + create trigger)
│   ├── SimplePostWidget (click → opens ContentComposer in AdaptivePanel)
├── FeedList
│   ├── FeedItem (post)
│   ├── FeedItem (event)
│   ├── FeedItem (post)
│   └── ...
└── AdaptivePanel (ContentComposer for create/edit, CommentSection for detail)
```

### FeedHeader

- **SimplePostWidget** as a click trigger ("Was gibt's Neues?") — opens the ContentComposer in a fullscreen modal for creating new content.
- No inline form — creation happens in a dedicated modal, similar to the prototype's SmartPostWidget behavior. This differs from the Kanban pattern (sidebar) because feed content creation benefits from a focused, distraction-free view.

### FeedList

- Vertical list of FeedItems, `space-y-4`
- Sorted reverse chronologically (newest first)
- No pagination for v1 — all items loaded upfront via `useItems`

---

## 3. FeedItem (enhanced PostCard)

Each feed item is an enhanced version of the existing PostCard, enriched with reactions, comment count, and type-specific metadata.

### Visual structure

```
┌──────────────────────────────────────────┐
│ 👤 Author Name  · [Type Badge]          │
│ vor 2 Stunden                            │
├──────────────────────────────────────────┤
│ [Title — if present]                     │
│                                          │
│ Content text, can be multiple lines.     │
│ Supports markdown rendering.             │
│                                          │
│ [📅 20. Maerz, 14:00 — if event]        │
│ [📍 Gemeinschaftsgarten — if location]   │
│ [🏷 tag1 · tag2 — if tags]              │
├──────────────────────────────────────────┤
│ [❤️ 12  👍 5  😂 3  +]                  │
│                                          │
│ 💬 3 Kommentare                          │
└──────────────────────────────────────────┘
```

### Elements by item type

| Element | Post | Event | Task |
|---|---|---|---|
| Title | optional | required | required |
| Content/Description | required | optional | optional |
| Type badge | none | "Event" with Calendar icon | "Task" with CheckSquare icon |
| Date/Time | — | start + optional end | — |
| Location | — | optional | — |
| Tags | optional | optional | optional |
| Reactions | yes | yes | no |
| Comment count | yes | yes | yes |

### Data source

The FeedItem reads directly from `Item.data`:
- `title` — display as heading if present
- `content` / `description` — body text
- `start`, `end` — event date/time (rendered with RelativeTime or formatted date)
- `location` — GeoLocation display
- `address` — human-readable address
- `tags` — tag pills
- `reactions` — ReactionBar (via Reactable mixin)
- `commentCount` — comment indicator (via Commentable mixin)

### Interactions

- **Click on FeedItem** → opens detail view in AdaptivePanel (item detail + CommentSection)
- **ReactionBar** — inline, toggle reactions without opening the panel
- **Comment count** — clicking opens the detail view scrolled to comments

---

## 4. User Stories

### Feed display

- **US-F1**: As a user I see a feed of content items sorted newest first.
- **US-F2**: As a user I see each item with author avatar, author name, and relative timestamp (with full date tooltip).
- **US-F3**: As a user I see event items with a date/time display and an "Event" badge.
- **US-F4**: As a user I see post items with their content text. If a title is present, it appears as a heading above the content.
- **US-F5**: As a user I see tags displayed as small pills below the content.
- **US-F6**: As a user I see a ReactionBar on posts and events (items that support reactions).
- **US-F7**: As a user I see a comment count indicator on items that have comments.

### Content creation

- **US-F8**: As a user I see a "Was gibt's Neues?" placeholder (SimplePostWidget) at the top of the feed.
- **US-F9**: As a user, when I click the placeholder, the ContentComposer opens in a fullscreen modal where I can choose a content type (Post, Event, Task) and fill in the form.
- **US-F10**: As a user, after submitting, the new item appears at the top of the feed.

### Detail view

- **US-F11**: As a user, when I click a feed item, an AdaptivePanel (sidebar/drawer) opens showing the full item content and a CommentSection below.
- **US-F12**: As a user I can comment on the item from the detail panel (CommentInput sticky at bottom).
- **US-F13**: As a user, when I click the comment count on a feed item, the detail panel opens scrolled to the comment section.

### General

- **US-F14**: As an unauthenticated user I can read the feed but the create placeholder, reaction toggles, and comment input are hidden.
- **US-F15**: As a user I see new items from other users appear in real-time (via observable pattern).

---

## 5. Component Architecture

### Components

```
FeedView               — top-level feed container
  FeedHeader           — SimplePostWidget trigger + optional stats
  FeedList             — sorted list of FeedItems
    FeedItem           — single item: author, content, metadata, reactions, comment count
  AdaptivePanel (modal-only)
    ContentComposer    — create mode (fullscreen modal)
  AdaptivePanel
    ItemDetail         — detail view: full content + CommentSection
```

### Existing components reused

| Component | Used for |
|---|---|
| SimplePostWidget | Create trigger in FeedHeader |
| ContentComposer | Create/edit form in AdaptivePanel |
| ReactionBar | Inline reactions on FeedItems |
| CommentSection | Comments in ItemDetail panel |
| CommentInput | Sticky input in ItemDetail panel |
| RelativeTime | Timestamps on FeedItems and comments |
| AdaptivePanel | Detail view / create form container |
| Avatar | Author display |

### New components needed

| Component | Purpose |
|---|---|
| FeedView | Container: header + list + panel state |
| FeedItem | Enhanced PostCard: renders any item type with metadata, reactions, comments |
| ItemDetail | Full item view for the AdaptivePanel: content + CommentSection |

### Hooks

```
useItems({ type: "post" })     — existing, loads posts
useItems({ type: "event" })    — existing, loads events
useCreateItem()                — existing, creates new items
useMembers(groupId)            — existing, resolves authors
useCurrentUser()               — existing, current user info
```

No new hooks needed — the feed uses existing data hooks.

---

## 6. FeedItem vs PostCard

The existing `PostCard` in the toolkit has a fixed `Post` interface with `likes: number`, `comments: number`, `type: PostType`. This doesn't align with the Item model.

**Decision**: Create a new `FeedItem` component that works directly with `Item` objects and renders type-specific metadata. The old `PostCard` remains for backward compatibility but is not used in the feed.

`FeedItem` reads from `Item.data` directly, uses `RelativeTime` for timestamps, `ReactionBar` for reactions, and shows metadata (date, location, tags) based on which fields are present.

---

## 7. Adapting from Prototype

### What to keep
- Reverse chronological sort
- Type badges (Event, Anfrage/Task)
- Author avatar + name + relative timestamp
- Content display with line clamp (expandable on click)
- Reaction display

### What to change
- No Framer Motion animations → CSS transitions (fade-in on new items)
- No distance-based sort (future feature)
- No inline SmartPostWidget → click trigger opens ContentComposer in AdaptivePanel
- No localStorage — data flows through connectors
- PostCard interface replaced by direct Item rendering in FeedItem

### What to add
- Comment count on feed items
- Detail panel with full content + CommentSection
- ReactionBar integration (was prototype-only local state)
- RelativeTime with tooltip (replaces date-fns formatDistanceToNow)
- Content creation via ContentComposer (multi-type: post, event, task)

---

## 8. Content Types in Feed

The ContentComposer in the feed supports multiple content types:

```typescript
const feedContentTypes: ContentTypeConfig[] = [
  {
    id: "post",
    label: "Post",
    defaultWidgets: ["text"],
    submitLabel: "Posten",
  },
  {
    id: "event",
    label: "Veranstaltung",
    defaultWidgets: ["title", "text", "date", "location"],
    submitLabel: "Erstellen",
  },
  {
    id: "task",
    label: "Task",
    defaultWidgets: ["title", "text", "status", "tags"],
    widgetLabels: { text: "Beschreibung" },
    submitLabel: "Task erstellen",
    statusOptions: [
      { id: "todo", label: "To Do" },
      { id: "doing", label: "In Arbeit" },
      { id: "done", label: "Erledigt" },
    ],
    defaultStatus: "todo",
  },
]
```

---

## 9. Scope and Non-Goals

### In scope
- FeedView with reverse chronological FeedItems
- FeedItem rendering any item type with type-specific metadata
- Content creation via SimplePostWidget → ContentComposer in AdaptivePanel
- Item detail view with CommentSection in AdaptivePanel
- ReactionBar on posts and events
- Comment count display
- RelativeTime timestamps
- Real-time updates

### Not in scope (future)
- Pagination / infinite scroll
- Feed filtering by type, author, or tag
- Sort by distance / location
- Media display (images, video) in feed items
- Feed search
- Pinned / featured posts
- Feed grouping (by date, by type)

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-31 | Initial requirements specification |
