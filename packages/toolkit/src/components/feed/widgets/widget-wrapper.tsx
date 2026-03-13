"use client"

import type * as React from "react"

interface WidgetWrapperProps {
  visible: boolean
  children: React.ReactNode
}

export function WidgetWrapper({ visible, children }: WidgetWrapperProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: visible ? "1fr" : "0fr",
        opacity: visible ? 1 : 0,
        transition:
          "grid-template-rows 200ms ease-out, opacity 200ms ease-out",
      }}
    >
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  )
}
