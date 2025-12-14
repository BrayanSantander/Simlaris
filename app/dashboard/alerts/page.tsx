"use client"

import { useEffect, useState } from "react"
import type { Alert as AlertType } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, AlertTriangle, Loader2, Brain } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

export default function AlertsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [loading, setLoading] = useState(true)
  const [lastAnalysis, setLastAnalysis] = useState<any | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!userRole) {
      setLoading(false)
      return
    }

    loadAlerts()

    const checkInterval = setInterval(async () => {
      await checkAnomaliesAndGenerateAlerts()
    }, 30000)

    return () => clearInterval(checkInterval)
  }, [userRole, authLoading])

  const loadAlerts = async () => {
    const alertsData = await FirestoreService.getAlerts()
    setAlerts(alertsData)
    setLoading(false)
  }

  const checkAnomaliesAndGenerateAlerts = async () => {
    try {
      console.log("[v0] Checking for anomalies using local analysis")
      const response = await fetch("/api/anomaly-local?collection=prueba")

      if (!response.ok) {
        console.error("[v0] Error fetching analysis:", response.statusText)
        return
      }

      const data = await response.json()
      setLastAnalysis(data)

      const { analysis } = data

      console.log("[v0] Analysis result:", analysis)

      // Generate alert based on severity
      if (analysis.severity === "CRITICO") {
        const alert: Omit<AlertType, "id"> = {
          machineId: "local-analysis",
          machineName: "Sistema de Análisis Local",
          type: "prediction",
          severity: "critical",
          message: `ALERTA CRÍTICA: ${analysis.recommendations[0] || "Anomalía crítica detectada"}`,
          timestamp: Date.now(),
          acknowledged: false,
        }

        console.log("[v0] Creating CRITICAL alert")
        await FirestoreService.createAlert(alert)
        await loadAlerts()
      } else if (analysis.severity === "ADVERTENCIA") {
        const alert: Omit<AlertType, "id"> = {
          machineId: "local-analysis",
          machineName: "Sistema de Análisis Local",
          type: "prediction",
          severity: "warning",
          message: `ADVERTENCIA: ${analysis.recommendations[0] || "Anomalía detectada"}`,
          timestamp: Date.now(),
          acknowledged: false,
        }

        console.log("[v0] Creating WARNING alert")
        await FirestoreService.createAlert(alert)
        await loadAlerts()
      }
    } catch (error) {
      console.error("[v0] Error checking anomalies:", error)
    }
  }

  const handleAcknowledge = async (id: string) => {
    await FirestoreService.acknowledgeAlert(id)
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)))
  }

  const handleAcknowledgeAll = async () => {
    const unacknowledged = alerts.filter((a) => !a.acknowledged)
    await Promise.all(unacknowledged.map((alert) => FirestoreService.acknowledgeAlert(alert.id)))
    setAlerts((prev) => prev.map((alert) => ({ ...alert, acknowledged: true })))
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando alertas...</p>
        </div>
      </div>
    )
  }

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical")
  const warningAlerts = alerts.filter((a) => a.severity === "warning")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Alertas</h1>
          <p className="text-muted-foreground mt-1">Gestión y seguimiento de alertas del sistema</p>
        </div>
        {unacknowledgedAlerts.length > 0 && (
          <Button onClick={handleAcknowledgeAll} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Reconocer todas
          </Button>
        )}
      </div>

      {lastAnalysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              Estado del Sistema de Detección de Anomalías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Última verificación</p>
                <p className="text-sm font-medium">{new Date(lastAnalysis.timestamp).toLocaleTimeString("es-ES")}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  lastAnalysis.analysis.severity === "NORMAL"
                    ? "bg-chart-3/10 text-chart-3 border-chart-3/30"
                    : lastAnalysis.analysis.severity === "ADVERTENCIA"
                      ? "bg-chart-4/10 text-chart-4 border-chart-4/30"
                      : "bg-chart-5/10 text-chart-5 border-chart-5/30"
                }
              >
                {lastAnalysis.analysis.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El sistema verifica los sensores cada 30 segundos usando análisis estadístico local y genera alertas
              automáticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sin Reconocer</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold mt-2">{unacknowledgedAlerts.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chart-5" />
            </div>
            <p className="text-3xl font-bold mt-2">{criticalAlerts.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Advertencias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chart-4" />
            </div>
            <p className="text-3xl font-bold mt-2">{warningAlerts.length}</p>
          </CardHeader>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todas
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unacknowledged">
            Sin reconocer
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="critical">
            Críticas
            {criticalAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {criticalAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No hay alertas registradas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Las alertas aparecerán cuando el modelo detecte anomalías
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />)
          )}
        </TabsContent>

        <TabsContent value="unacknowledged" className="space-y-3">
          {unacknowledgedAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Todas las alertas han sido reconocidas</p>
              </CardContent>
            </Card>
          ) : (
            unacknowledgedAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-3">
          {criticalAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay alertas críticas</p>
              </CardContent>
            </Card>
          ) : (
            criticalAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
