# Reactions — Requirements Specification

## 1. Overview

**Reactions** allow users to respond to content with emoji. The system consists of three UI parts:

1. **ReactionBar** — inline summary of existing reactions on an item, plus a button to add new ones
2. **ReactionPicker** — floating panel showing the available emoji set for selection
3. **ReactionUsersPanel** — panel showing which users reacted, with emoji tabs

Reactions are applicable to any item type that supports them (initially: post, comment). The architecture follows the RLS item+relations model: each reaction is a dedicated item with a `reactsTo` relation to the target.

### Design principles

- **Dependency-free** — no emoji libraries, no Framer Motion. CSS transitions, native scroll.
- **Contextual positioning** — the picker opens near the trigger and always fits on screen.
- **Fixed emoji set** — 16 curated emojis covering the most common reaction needs. No full emoji keyboard.
- **Aggregated display** — the ReactionBar groups reactions by emoji, sorted by frequency.

---

## 2. Emoji Set

### Decision: Fixed curated set (16 emojis)

Rather than offering the full Unicode emoji catalog (~1800 emojis with categories, search, skin tones), we use a fixed set of 16 emojis that cover the essential reactions in a community app:

```
❤️ 👍 👎 😂 😮 😢 😡 🙏 🔥 🎉 🤔 💪 🚀 ✨ 👀 🤝
```

| Emoji | Meaning |
|---|---|
| ❤️ | Love, appreciation |
| 👍 | Agreement, approval |
| 👎 | Disagreement |
| 😂 | Humor, laughter |
| 😮 | Surprise |
| 😢 | Sadness, sympathy |
| 😡 | Anger, frustration |
| 🙏 | Gratitude, please |
| 🔥 | Excitement, hot take |
| 🎉 | Celebration |
| 🤔 | Thinking, questioning |
| 💪 | Strength, encouragement |
| 🚀 | Progress, launch |
| ✨ | Quality, magic |
| 👀 | Attention, watching |
| 🤝 | Collaboration, agreement |

This set is comparable to GitHub (8 reactions) and WhatsApp (6 reactions) but covers a broader range of community communication needs.

### Rationale

- **90%+ coverage**: In practice, the vast majority of reactions in social/community apps use fewer than 10 distinct emojis. 16 emojis provide enough variety for differentiated expression without overwhelming the user.
- **No search needed**: With 16 emojis visible at once, there is no need for search, categories, or scrolling.
- **No skin tone handling**: Gesture emojis (👍, 👎, 💪, 🤝) use the default yellow skin tone. Skin tone selection adds significant complexity for minimal value in a reactions context.
- **Extensible**: The set is defined as a constant. Adding more emojis or introducing a full picker later is a UI change, not a data model change — the data model supports arbitrary emoji strings.

### Future extension path

If user demand arises for a broader emoji set, the architecture supports adding a full picker (Stage 2) without data model changes:

| Level | Emojis | Complexity | When |
|---|---|---|---|
| **Current** | 16 fixed | Low | Now |
| Categorized picker | ~100–150 curated | Medium | If users request more variety |
| Full picker | ~350+ (like prototype) | High — needs search, categories, DE/EN terms | If community apps need Slack-level reactions |

The prototype app already contains a full emoji picker implementation with ~350 emojis and DE+EN search terms (see `apps/prototype/src/components/ui/EmojiReactionPicker.tsx`) that can serve as a starting point for the full picker if needed.

---

## 3. Library Evaluation

We evaluated existing React emoji picker and reaction libraries. None met our requirements, so we build the components ourselves.

### Evaluated libraries

| Library | Bundle (gzip) | Deps | Approach | German search | Maintenance | Verdict |
|---|---|---|---|---|---|---|
| **frimousse** | ~12 kB | 0 | Headless, composable | Yes (Emojibase CDN) | Active (2025) | Best fit for a full picker, but overkill for 16 fixed emojis |
| **emoji-picker-react** | ~80 kB | Minimal | Opinionated CSS | UI labels only | Active | Built-in two-stage mode, but large bundle + no Tailwind |
| **emoji-mart** | ~13 kB + 2 MB data | 3 packages | Web Component | UI labels only | Inactive (3y) | Feature-rich but stale, Web Component clashes with React/Tailwind |
| **emoji-picker-element** | ~12.5 kB | 0 | Web Component | Yes | Active | Tiny bundle, but Web Component + Shadow DOM conflicts with Tailwind |
| **@charkour/react-reactions** | Small | 0 | Pre-styled | N/A | Inactive (3y) | Reaction bar component, but unmaintained and not Tailwind-native |

### Decision: Build in-house

**Reasons:**

1. **Fixed set eliminates the hard problem.** The main value of emoji libraries is the emoji database (~1800 emojis with metadata, search terms, skin tone variants, browser compatibility checks). With a fixed 16-emoji set, this value disappears.
2. **Trivial implementation.** 16 buttons in a floating panel is simpler than integrating and styling a library. The ReactionBar (emoji pills with counts) is a few dozen lines of Tailwind.
3. **No styling conflicts.** All evaluated libraries either use opinionated CSS (emoji-picker-react), Web Components with Shadow DOM (emoji-mart, emoji-picker-element), or would need wrapping to fit shadcn/ui conventions. Building with Tailwind + Radix primitives (already in the toolkit) avoids this entirely.
4. **Bundle size = 0.** No additional dependency for 16 buttons.
5. **Future-proof.** If we later need a full picker, `frimousse` (headless, 12 kB, shadcn integration) is the clear candidate. The ReactionBar and data model remain unchanged — only the picker UI would swap.

---

## 4. Data Model

### Two layers: summary on the item + detail via reaction items

Reactions are stored at two levels:

1. **Summary on the target item** (`data.reactions`) — aggregated emoji counts, available immediately without extra requests. Enables the ReactionBar to render from the item alone.
2. **Individual reaction items** (`type: "reaction"`) — one per user+emoji+target, linked via `reactsTo` relation. Enables per-user attribution, toggle behavior, and the "who reacted" panel.

The summary is the **read-optimized view**. The reaction items are the **source of truth**. Connectors keep them in sync (e.g. on createItem/deleteItem of a reaction, the connector updates the target item's `data.reactions`).

### Layer 1: Reactions summary on the target item

Any item that supports reactions carries a `reactions` field in its `data`:

```typescript
// Post item with reaction summary
{
  id: "post-1",
  type: "post",
  data: {
    content: "Hello world",
    reactions: {
      "❤️": 12,
      "👍": 5,
      "😂": 3
    }
  }
}
```

This is a `Record<string, number>` — emoji → count. The ReactionBar renders directly from this field. No extra request needed.

### Layer 2: Individual reaction items (per-user attribution)

Each reaction is a lightweight item with a `reactsTo` relation to the target:

```typescript
// Reaction item (type: "reaction")
{
  id: "reaction-1",
  type: "reaction",
  createdBy: "user-1",
  createdAt: "2026-03-19T10:00:00Z",
  data: {
    emoji: "❤️"
  },
  relations: [
    { predicate: "reactsTo", target: "item:post-1" }
  ]
}
```

#### Types in item-types.ts

```typescript
/** Aggregated reaction counts, embedded in target item's data. */
export type ReactionSummary = Record<string, number>

export interface ReactionData {
  /** The emoji character used for this reaction. */
  emoji: string
}

export type ReactionItem = Item & { type: "reaction"; data: ReactionData }

export interface ReactionRelations {
  forward: {
    /** Reaction targets an item → any Item (scope: item:, 1) */
    reactsTo: Item
  }
}
```

Additionally, PostData (and any other item type supporting reactions) has an optional `reactions` field:

```typescript
export interface PostData {
  // ... existing fields ...
  /** Aggregated reaction counts. Emoji → number of users. Maintained by connector. */
  reactions?: ReactionSummary
}
```

#### Querying

- **Render ReactionBar:** Read `item.data.reactions` — no extra request
- **Check if current user reacted with a specific emoji:** `getRelatedItems(postId, "reactsTo", { direction: "to" })`, filter by `createdBy === currentUserId` and `data.emoji === emoji`
- **Get users who reacted with an emoji (for ReactionUsersPanel):** `getRelatedItems(postId, "reactsTo", { direction: "to" })`, filter by `data.emoji`, resolve user info from `createdBy`
- **Toggle reaction:** Create or delete the user's reaction item — connector updates `data.reactions` on the target

### Aggregated view model (UI)

The hook computes this from `item.data.reactions` (counts) + current user's reaction items (toggle state):

```typescript
interface AggregatedReaction {
  /** The emoji character. */
  emoji: string
  /** Total count of users who reacted with this emoji. */
  count: number
  /** Whether the current user has reacted with this emoji. */
  reacted: boolean
}
```

---

## 5. User Stories

### ReactionBar (inline display)

- **US-R1**: As a user I see a compact row of emoji pills below a post/comment, each showing the emoji and its count (e.g. `❤️ 12  👍 5  😂 3`), sorted by frequency (highest first).
- **US-R2**: As a user I see at most N emojis in the bar (e.g. 6). If there are more distinct emojis, the rest are collapsed into a `+3` overflow indicator.
- **US-R3**: As a user I can click an emoji pill to toggle my reaction — if I haven't reacted with that emoji, I add my reaction; if I already have, I remove it.
- **US-R4**: As a user I see my own reactions visually highlighted (e.g. colored border or background) so I know which emojis I've used.
- **US-R5**: As a user I see a `+` button (or `+ 😊`) at the end of the reaction bar to open the ReactionPicker.
- **US-R6**: As a user I can tap/click on an emoji pill to open the **ReactionUsersPanel** that shows all users who reacted with that emoji.

### ReactionPicker

- **US-R7**: As a user, when I click the `+` button, a floating panel appears near the trigger showing all 16 available emojis as clickable buttons.
- **US-R8**: As a user I can click an emoji in the picker to immediately add my reaction — the picker closes after selection.
- **US-R9**: As a user the picker always positions itself to fit on screen — it flips direction if there isn't enough space above/below/left/right.
- **US-R10**: As a user I can close the picker by clicking outside, pressing Escape, or selecting an emoji.

### ReactionUsersPanel (who reacted)

- **US-R11**: As a user I see the ReactionUsersPanel when I tap/click an emoji pill in the ReactionBar. It shows a list of users (avatar + display name) who reacted with that emoji.
- **US-R12**: As a user I see emoji tabs/pills at the top of the panel so I can switch between emojis to see who reacted with each one, without closing and reopening.
- **US-R13**: As a user the first tab shows "All" with all users who reacted (any emoji), grouped by emoji.
- **US-R14**: As a user the panel opens in an AdaptivePanel (bottom sheet on mobile, popover/panel on desktop).
- **US-R15**: As a user I can close the panel by swiping down (mobile), clicking outside, or pressing Escape.

### General

- **US-R16**: As a user the ReactionBar, ReactionPicker, and ReactionUsersPanel work on both posts and comments.
- **US-R17**: As a user I see reaction changes in real-time when other users react (via observable pattern).
- **US-R18**: As a developer I can embed `<ReactionBar>` on any item by passing the item ID. The component handles data fetching and mutations internally via hooks.

---

## 6. Component Architecture

### Components

```
ReactionBar            — inline display: emoji pills + "add" button
ReactionPicker         — floating panel with all 16 emojis
ReactionUsersPanel     — panel showing which users reacted, with emoji tabs
```

### Hooks

```
useReactions(itemId)                — returns AggregatedReaction[], toggle(emoji), loading state
useReactionUsers(itemId, emoji?)    — returns users who reacted (optionally filtered by emoji), lazy-loaded
```

### Component tree

```tsx
<ReactionBar itemId="post-1">
  {/* Renders: emoji pills | +add button */}

  {/* On emoji pill click: */}
  <ReactionUsersPanel
    itemId="post-1"
    initialEmoji="❤️"
    reactions={aggregatedReactions}
    onClose={() => ...}
  />

  {/* On "+add" click: */}
  <ReactionPicker
    onSelect={(emoji) => toggle(emoji)}
    onClose={() => ...}
    anchorRef={addButtonRef}
  />
</ReactionBar>
```

---

## 7. Positioning Strategy

The ReactionPicker must always fit on screen while staying near its trigger. Strategy:

1. Measure trigger button position via `getBoundingClientRect()`
2. Measure picker dimensions after render (via ref)
3. Calculate preferred position (below-left of trigger)
4. Flip vertically if not enough space below → show above
5. Flip horizontally if not enough space to the right → align right edge
6. Clamp to viewport edges with a small margin (e.g. 8px)

Implementation: CSS `position: fixed` with calculated `top`/`left`. No Popper.js or Floating UI dependency — manual calculation is sufficient for this use case. Re-calculate on scroll/resize via a lightweight listener.

---

## 8. Animations

- **Picker appear/disappear:** `opacity 0→1` + `scale(0.95)→scale(1)`, 150ms ease-out. Origin at trigger button.
- **Emoji pill toggle:** Brief `scale(1.2)` pulse on the pill, 150ms.
- **No Framer Motion.** CSS transitions only.

---

## 9. Accessibility

- ReactionPicker is keyboard-navigable (arrow keys between emojis, Enter to select, Escape to close)
- Focus trap inside the picker when open
- Emoji pills have `aria-label` with emoji name + count (e.g. "Heart, 12 reactions")
- `aria-pressed` on pills for toggle state
- Screen reader announces reaction changes

---

## 10. Props Interfaces

```typescript
/** The 16 available reaction emojis. */
export const REACTION_EMOJIS = [
  "❤️", "👍", "👎", "😂", "😮", "😢", "😡", "🙏",
  "🔥", "🎉", "🤔", "💪", "🚀", "✨", "👀", "🤝",
] as const

export type ReactionEmoji = typeof REACTION_EMOJIS[number]

interface ReactionBarProps {
  /** ID of the item to show reactions for. */
  itemId: string
  /** Maximum number of distinct emojis to show before collapsing. Default: 6. */
  maxVisible?: number
  /** Additional CSS classes. */
  className?: string
}

interface ReactionPickerProps {
  /** Callback when an emoji is selected. */
  onSelect: (emoji: string) => void
  /** Callback when the picker is dismissed. */
  onClose: () => void
  /** Anchor element for positioning. */
  anchorRef: React.RefObject<HTMLElement>
}

interface ReactionUsersPanelProps {
  /** ID of the item to show reaction users for. */
  itemId: string
  /** Emoji to show initially (pre-selects the tab). */
  initialEmoji?: string
  /** Aggregated reactions (passed from ReactionBar to avoid re-fetching). */
  reactions: AggregatedReaction[]
  /** Callback when the panel is dismissed. */
  onClose: () => void
}
```

---

## 11. Scope and Non-Goals

### In scope
- ReactionBar display with aggregation and toggle
- ReactionPicker with 16 fixed emojis
- ReactionUsersPanel showing who reacted per emoji
- Reaction data model: summary counts on item + individual reaction items with `reactsTo` relation
- `useReactions` and `useReactionUsers` hooks with real-time updates
- Applicable to posts and comments
- User attribution (who reacted)
- Keyboard accessibility

### Not in scope (future)
- Full emoji picker with categories, search, and skin tones (upgrade path documented in section 2)
- Animated reaction effects (flying emojis, confetti)
- Custom/app-specific reaction types (non-emoji)
- Reaction notifications ("X reacted to your post")
- Reaction analytics / statistics
- Bulk reactions (react to multiple items at once)

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-19 | Initial requirements specification |
| 2026-03-19 | Two-layer data model: reaction summary on item + individual reaction items |
| 2026-03-19 | ReactionUsersPanel instead of tooltip (US-R11–R15) |
| 2026-03-19 | Removed likedBy predicate in favor of reactsTo |
| 2026-03-19 | Fixed emoji set (16 emojis) instead of full picker — library evaluation documented |
| 2026-03-19 | Evaluated frimousse, emoji-picker-react, emoji-mart, emoji-picker-element, @charkour/react-reactions — decided to build in-house |
