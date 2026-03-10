"use client"

import { ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu"

export interface ConnectorOption {
  id: string
  name: string
  description?: string
}

interface ConnectorSwitcherProps {
  connectors: ConnectorOption[]
  activeConnector: string
  onConnectorChange: (connectorId: string) => void
}

export function ConnectorSwitcher({
  connectors,
  activeConnector,
  onConnectorChange,
}: ConnectorSwitcherProps) {
  const active = connectors.find((c) => c.id === activeConnector)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-mono hover:bg-accent border border-dashed border-muted-foreground/30">
        <span className="text-muted-foreground">Connector:</span>
        <span className="font-semibold">{active?.name ?? activeConnector}</span>
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Connector wechseln (Dev)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => onConnectorChange(connector.id)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className={connector.id === activeConnector ? "font-semibold" : ""}>
              {connector.id === activeConnector ? `● ${connector.name}` : connector.name}
            </span>
            {connector.description && (
              <span className="text-xs text-muted-foreground">{connector.description}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
