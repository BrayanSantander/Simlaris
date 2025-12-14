import type { Machine, PredictionResult } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Wrench, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PredictionCardProps {
  machine: Machine
  prediction: PredictionResult
}

export function PredictionCard({ machine, prediction }: PredictionCardProps) {
  const getRiskLevel = (probability: number) => {
    if (probability > 70) return { label: "Crítico", color: "text-chart-5 bg-chart-5/10 border-chart-5/30" }
    if (probability > 40) return { label: "Advertencia", color: "text-chart-4 bg-chart-4/10 border-chart-4/30" }
    return { label: "Normal", color: "text-chart-3 bg-chart-3/10 border-chart-3/30" }
  }

  const riskLevel = getRiskLevel(prediction.failureProbability)
  const progressColor =
    prediction.failureProbability > 70 ? "bg-chart-5" : prediction.failureProbability > 40 ? "bg-chart-4" : "bg-chart-3"

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{machine.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{machine.location}</p>
          </div>
          <Badge variant="outline" className={cn("font-semibold", riskLevel.color)}>
            {riskLevel.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Failure Probability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Probabilidad de Falla</span>
            <span className="font-bold">{prediction.failureProbability}%</span>
          </div>
          <Progress value={prediction.failureProbability} className={progressColor} />
        </div>

        {/* Affected Component */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Wrench className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Componente Afectado</p>
            <p className="text-sm text-muted-foreground">{prediction.affectedComponent}</p>
          </div>
        </div>

        {/* Days to Maintenance */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Tiempo Estimado</p>
            <p className="text-sm text-muted-foreground">
              {prediction.estimatedDaysToMaintenance} días hasta mantenimiento recomendado
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Confianza del modelo</span>
          </div>
          <span className="text-sm font-semibold">{prediction.confidence}%</span>
        </div>

        {/* Actions */}
        <Link href={`/dashboard/machines/${machine.id}`}>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            Ver detalles de la máquina
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
