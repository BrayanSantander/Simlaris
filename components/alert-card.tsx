"use client"

import type { Alert as AlertType } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, XCircle, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface AlertCardProps {
  alert: AlertType
  onAcknowledge?: (id: string) => void
}

export function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
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
