"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, RefreshCw, Loader2, AlertTriangle, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface MachineAnalysis {
  machineId: string
  machineName: string
  status: "healthy" | "warning" | "critical"
  anomalyResult: {
    severity: "NORMAL" | "ADVERTENCIA" | "CRITICO"
    metrics: {
      vibrationScore: number
      temperatureScore: number
      gyroscopeScore: number
    }
    recommendations: string[]
  }
  trendAnalysis: {
    vibrationTrend: "stable" | "increasing" | "decreasing"
    temperatureTrend: "stable" | "increasing" | "decreasing"
    overallHealth: number
  }
  maintenanceSchedule: {
    estimatedDate: string
    daysUntilMaintenance: number
    priority: "low" | "medium" | "high" | "urgent"
    reason: string
    recommendations: string[]
  }
  historicalData: {
    avgVibration: number
    avgTemperature: number
    totalReadings: number
    anomalyCount: number
  }
}

export default function PredictivePage() {
  const [analyses, setAnalyses] = useState<MachineAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/predictive-analysis")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalyses(data.analyses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPredictions()
    const interval = setInterval(loadPredictions, 120000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "NORMAL":
        return "text-green-600 bg-green-50 border-green-200"
      case "ADVERTENCIA":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "CRITICO":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return ""
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return ""
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading && analyses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Analizando todas las máquinas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Mantenimiento Predictivo
          </h1>
          <p className="text-muted-foreground mt-1">Análisis inteligente por máquina con predicción de mantenimiento</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar análisis</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
            <Button onClick={loadPredictions} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Mantenimiento Predictivo
          </h1>
          <p className="text-muted-foreground mt-1">Análisis inteligente por máquina con predicción de mantenimiento</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay máquinas para analizar</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Agrega máquinas con sensores asociados en el módulo de Configuración
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedAnalyses = [...analyses].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.maintenanceSchedule.priority] - priorityOrder[b.maintenanceSchedule.priority]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Mantenimiento Predictivo
          </h1>
          <p className="text-muted-foreground mt-1">Análisis inteligente por máquina con predicción de mantenimiento</p>
        </div>
        <Button onClick={loadPredictions} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Máquinas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado Saludable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyses.filter((a) => a.status === "healthy").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Advertencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analyses.filter((a) => a.status === "warning").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analyses.filter((a) => a.status === "critical").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sortedAnalyses.map((analysis) => (
          <Card key={analysis.machineId} className={analysis.status !== "healthy" ? "border-2" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {analysis.machineName}
                    <Badge variant="outline" className={getSeverityColor(analysis.anomalyResult.severity)}>
                      {analysis.anomalyResult.severity}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Salud General: {analysis.trendAnalysis.overallHealth}% | {analysis.historicalData.totalReadings}{" "}
                    lecturas analizadas
                  </CardDescription>
                </div>
                <Badge variant="outline" className={getPriorityColor(analysis.maintenanceSchedule.priority)}>
                  {analysis.maintenanceSchedule.priority.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estado de Salud</span>
                  <span className="font-semibold">{analysis.trendAnalysis.overallHealth}%</span>
                </div>
                <Progress value={analysis.trendAnalysis.overallHealth} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Vibración</p>
                    {getTrendIcon(analysis.trendAnalysis.vibrationTrend)}
                  </div>
                  <p className="text-2xl font-bold">{analysis.anomalyResult.metrics.vibrationScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Promedio: {analysis.historicalData.avgVibration.toFixed(3)} g
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Temperatura</p>
                    {getTrendIcon(analysis.trendAnalysis.temperatureTrend)}
                  </div>
                  <p className="text-2xl font-bold">{analysis.anomalyResult.metrics.temperatureScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Promedio: {analysis.historicalData.avgTemperature.toFixed(1)}°C
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Giroscopio</p>
                  <p className="text-2xl font-bold">{analysis.anomalyResult.metrics.gyroscopeScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Desviaciones estándar</p>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Programa de Mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Estimada</p>
                      <p className="text-lg font-bold">{analysis.maintenanceSchedule.estimatedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Días Restantes</p>
                      <p className="text-lg font-bold">{analysis.maintenanceSchedule.daysUntilMaintenance} días</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Razón:</p>
                    <p className="text-sm text-muted-foreground">{analysis.maintenanceSchedule.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Acciones de Mantenimiento:</p>
                    <ul className="space-y-1">
                      {analysis.maintenanceSchedule.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="text-sm font-semibold mb-2">Diagnóstico y Recomendaciones:</p>
                <ul className="space-y-1">
                  {analysis.anomalyResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Anomalías detectadas en historial: {analysis.historicalData.anomalyCount} de{" "}
                  {analysis.historicalData.totalReadings} lecturas (
                  {((analysis.historicalData.anomalyCount / analysis.historicalData.totalReadings) * 100).toFixed(1)}
                  %)
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
