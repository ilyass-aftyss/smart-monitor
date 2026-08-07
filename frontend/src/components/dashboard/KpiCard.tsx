import { ArrowUpRight, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  hint?: string
  accent?: string
  className?: string
  children?: ReactNode
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  accent = "text-primary",
  className = "",
  children,
}: KpiCardProps) {
  return (
    <div
      className={`glass-card group relative flex flex-col p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-medium text-foreground/80">{label}</span>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/60 text-foreground/60 transition-colors group-hover:text-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}