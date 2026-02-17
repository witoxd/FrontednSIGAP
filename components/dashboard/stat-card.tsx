import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: "up" | "down" | "neutral"
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
