"use client"

import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/primitives/card"
import { cn } from "@/lib/utils"

type StatColor = "blue" | "green" | "orange" | "purple" | "red"

interface StatCardProps {
  icon: LucideIcon
  value: number | string
  label: string
  color?: StatColor
  className?: string
}

const colorClasses: Record<StatColor, { bg: string; text: string }> = {
  blue: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  green: {
    bg: "bg-secondary/10",
    text: "text-secondary",
  },
  orange: {
    bg: "bg-accent/10",
    text: "text-accent",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
  red: {
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
}

export function StatCard({
  icon: Icon,
  value,
  label,
  color = "blue",
  className,
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="px-3 py-3 text-center">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg mx-auto mb-2",
            colors.bg
          )}
        >
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
