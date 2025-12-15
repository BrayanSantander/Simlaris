"use client"

import { useEffect, useState, useRef } from "react"
import type { Alert as AlertType, Machine } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { AlertGeneratorService } from "@/lib/services/alert-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, AlertTriangle, Loader2, Activity, Factory } from "lucide-react"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [monitoring, setMonitoring] = useState(false)
  const recentAlertTypes = useRef<Set<string>>(new Set())
  const lastCheckTime = useRef<number>(Date.now())

  useEffect(() => {
    loadInitialData()
  }, [])

  // Sistema de monitoreo de umbrales
  useEffect(() => {
    if (machines.length === 0) return

    setMonitoring(true)

    const checkThresholds = async () => {
      const now = Date.now()
      // Limpiar alertas antiguas (más de 5 minutos) del cache
      if (now - lastCheckTime.current > 300000) {
        recentAlertTypes.current.clear()
        lastCheckTime.current = now
      }

      for (const machine of machines) {
        if (!machine.sensorCollectionName || !machine.thresholds) continue

        // Obtener el último dato de sensor
        const sensorData = await FirestoreService.getSensorData(machine.id, 0.1) // Últimos ~6 minutos
        if (sensorData.length === 0) continue

        const latestData = sensorData[sensorData.length - 1]

        // Verificar umbrales
        const violations = AlertGeneratorService.checkThresholds(machine, latestData)

        if (violations.length > 0) {
          await AlertGeneratorService.createAlertsForViolations(machine, violations, recentAlertTypes.current)
          // Recargar alertas si se crearon nuevas
          await loadAlerts()
        }
      }
    }

    // Verificar inmediatamente y luego cada 30 segundos
    checkThresholds()
    const interval = setInterval(checkThresholds, 30000)

    return () => {
      clearInterval(interval)
      setMonitoring(false)
    }
  }, [machines])

  const loadInitialData = async () => {
    const [alertsData, machinesData] = await Promise.all([FirestoreService.getAlerts(), FirestoreService.getMachines()])
    setAlerts(alertsData)
    setMachines(machinesData)
    setLoading(false)
  }

  const loadAlerts = async () => {
    const alertsData = await FirestoreService.getAlerts()
    setAlerts(alertsData)
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

  // Agrupar alertas por máquina
  const alertsByMachine = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.machineId]) {
        acc[alert.machineId] = { machineName: alert.machineName, alerts: [] }
      }
      acc[alert.machineId].alerts.push(alert)
      return acc
    },
    {} as Record<string, { machineName: string; alerts: AlertType[] }>,
  )

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

      {/* Estado del monitoreo */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className={`h-5 w-5 ${monitoring ? "text-chart-3 animate-pulse" : "text-muted-foreground"}`} />
            Monitoreo de Umbrales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {monitoring ? "Verificando datos de sensores cada 30 segundos" : "Iniciando monitoreo..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {machines.filter((m) => m.thresholds && m.sensorCollectionName).length} máquinas con umbrales
                configurados
              </p>
            </div>
            <Badge variant="outline" className={monitoring ? "bg-chart-3/10 text-chart-3 border-chart-3/30" : ""}>
              {monitoring ? "Activo" : "Iniciando"}
            </Badge>
          </div>
        </CardContent>
      </Card>

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
          <TabsTrigger value="by-machine">Por Máquina</TabsTrigger>
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
                  Las alertas aparecerán cuando los sensores superen los umbrales configurados
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />)
          )}
        </TabsContent>

        <TabsContent value="by-machine" className="space-y-4">
          {Object.keys(alertsByMachine).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No hay alertas por máquina</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(alertsByMachine).map(([machineId, { machineName, alerts: machineAlerts }]) => (
              <Card key={machineId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Factory className="h-4 w-4" />
                    {machineName}
                    <Badge variant="secondary">{machineAlerts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {machineAlerts.slice(0, 5).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} compact />
                  ))}
                  {machineAlerts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{machineAlerts.length - 5} alertas más
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
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
