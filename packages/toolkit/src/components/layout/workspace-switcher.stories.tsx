import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { WorkspaceSwitcher, type Workspace } from "./workspace-switcher"

const WORKSPACES: Workspace[] = [
  { id: "__overview__", name: "Mein Netzwerk", scope: "overview" },
  { id: "group-1", name: "Gemeinschaftsgarten" },
  { id: "group-2", name: "Nachbarschaftshilfe", avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=nachbarschaft" },
  { id: "group-3", name: "Repair-Café" },
]

/**
 * **WorkspaceSwitcher** is the space in the header's left compartment: the
 * active space with avatar and name, the list of your spaces, the overview
 * "Mein Netzwerk" on top, and — when the frame provides the handlers —
 * "create a space" and "edit" per space. It shows a syncing hint while a
 * device receives its first stock, so a short list is not mistaken for a
 * complete one.
 */
const meta: Meta<typeof WorkspaceSwitcher> = {
  tags: ["autodocs"],
  id: "rls-app-shell-workspace-switcher",
  title: "RLS/App shell/Space switcher/WorkspaceSwitcher",
  component: WorkspaceSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          "App-Shell-Fläche zum Wechseln des Current Space. Zeigt das Overview-Pseudo-Workspace (\"Mein Netzwerk\") getrennt von den Gruppen. `activeWorkspace` darf null sein — z.B. wenn die URL auf einen Space ohne Zugriff zeigt; der Trigger rendert dann einen neutralen Zustand, das Dropdown bleibt voll bedienbar.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof WorkspaceSwitcher>

function InteractiveSwitcher({ initial }: { initial: Workspace | null }) {
  const [active, setActive] = useState<Workspace | null>(initial)
  return (
    <WorkspaceSwitcher
      workspaces={WORKSPACES}
      activeWorkspace={active}
      onWorkspaceChange={setActive}
      onCreateWorkspace={() => console.log("create workspace")}
      onEditWorkspace={(w) => console.log("edit workspace", w.id)}
    />
  )
}

/** A group is active — avatar and name in the trigger. */
export const GroupActive: Story = {
  name: "A group is active",
  render: () => <InteractiveSwitcher initial={WORKSPACES[1]} />,
}

/** The overview pseudo-workspace is active — home icon instead of avatar. */
export const OverviewActive: Story = {
  name: "The overview is active",
  render: () => <InteractiveSwitcher initial={WORKSPACES[0]} />,
}

/**
 * No active workspace (null) — the state behind the no-access screen: the URL
 * points to a space the user is not a member of. The trigger reads "Space
 * wählen", the dropdown stays the way out to your own spaces.
 */
export const NoActiveWorkspace: Story = {
  name: "No access",
  render: () => <InteractiveSwitcher initial={null} />,
}

/**
 * Der Mensch ist Mitglied in Netzwerken (Spec 04): Sie stehen oben mit
 * Zahnrad, darunter „Mein Netzwerk", dann die Gruppen des aktiven Netzwerks,
 * gegliedert nach dessen Arten. Spaces ohne Art zuletzt unter „Gruppen".
 */
export const WithNetworks: Story = {
  render: () => {
    const kinds = [
      { id: "stiftung", label: "Stiftung", labelPlural: "Stiftungen", color: "#1B5E40" },
      { id: "projekt", label: "Projekt", labelPlural: "Projekte", color: "#EA580C" },
    ]
    const workspaces: Workspace[] = [
      { id: "td", name: "trustdonation", isNetwork: true, kinds },
      { id: "mn", name: "macher.network", isNetwork: true, kinds: [] },
      { id: "__overview__", name: "Mein Netzwerk", scope: "overview" },
      { id: "s-1", name: "Bürgerstiftung Kassel", network: "td", kind: "stiftung" },
      { id: "s-2", name: "Software AG-Stiftung", network: "td", kind: "stiftung" },
      { id: "p-1", name: "Werkstatt am Bahnhof", network: "td", kind: "projekt" },
      { id: "p-2", name: "Musterschule Gudensberg", network: "td", kind: "projekt" },
      { id: "g-1", name: "Tratsch & Off-Topics", network: "td" },
      { id: "m-1", name: "Holzwerkstatt", network: "mn" },
    ]
    const [active, setActive] = useState<Workspace | null>(workspaces[0])
    const activeNetworkId = active?.isNetwork ? active.id : (active?.network ?? "td")
    return (
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspace={active}
        onWorkspaceChange={setActive}
        onCreateWorkspace={() => console.log("create workspace")}
        onEditWorkspace={(w) => console.log("edit workspace", w.id)}
        activeNetworkId={activeNetworkId}
      />
    )
  },
}
