// Componente para mostrar estado de máquinas

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "operational" | "warning" | "critical" | "offline"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    operational: {
      label: "Operacional",
      className: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    },
    warning: {
      label: "Advertencia",
      className: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    },
    critical: {
      label: "Crítico",
      className: "bg-chart-5/20 text-chart-5 border-chart-5/30",
    },
    offline: {
      label: "Fuera de línea",
      className: "bg-muted text-muted-foreground border-border",
    },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={cn("font-medium", variant.className, className)}>
      {variant.label}
    </Badge>
  )
}
