"use client"

import type { Alert as AlertType } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, XCircle, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  alert: AlertType
  onAcknowledge?: (id: string) => void
  compact?: boolean
}

export function AlertCard({ alert, onAcknowledge, compact = false }: AlertCardProps) {
  const getIcon = () => {
    if (alert.severity === "critical") return XCircle
    if (alert.severity === "warning") return AlertTriangle
    return Info
  }

  const getVariant = () => {
    if (alert.severity === "critical") return "destructive"
    return "default"
  }

  const Icon = getIcon()

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-2 rounded-lg border",
          alert.severity === "critical" ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border",
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon
            className={cn("h-4 w-4 shrink-0", alert.severity === "critical" ? "text-destructive" : "text-chart-4")}
          />
          <p className="text-sm truncate">{alert.message}</p>
          <Badge variant="outline" className="text-xs capitalize shrink-0">
            {alert.type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: es })}
          </span>
          {!alert.acknowledged && onAcknowledge && (
            <Button size="sm" variant="ghost" onClick={() => onAcknowledge(alert.id)} className="h-7 px-2">
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Alert variant={getVariant()} className="relative">
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{alert.machineName}</p>
            <Badge variant="outline" className="text-xs capitalize">
              {alert.type}
            </Badge>
          </div>
          <p className="text-sm">{alert.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: es })}
          </p>
        </div>
        {!alert.acknowledged && onAcknowledge && (
          <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)} className="shrink-0">
            <Check className="h-4 w-4 mr-1" />
            Reconocer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
