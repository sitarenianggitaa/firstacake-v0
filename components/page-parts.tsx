import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-balance text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground text-pretty">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: "default" | "warning" | "danger" | "success"
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    warning: "bg-accent text-accent-foreground",
    danger: "bg-destructive/15 text-destructive",
    success: "bg-chart-2/20 text-chart-1",
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardContent>
    </Card>
  )
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info"

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-chart-2/20 text-chart-1",
  warning: "bg-accent text-accent-foreground",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-primary/10 text-primary",
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeToneClasses[tone],
      )}
    >
      {label}
    </span>
  )
}
