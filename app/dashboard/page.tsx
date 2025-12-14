"use client"

import { useEffect, useState } from "react"
import type { Machine, Alert as AlertType } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MachineCard } from "@/components/machine-card"
import { AlertCard } from "@/components/alert-card"
import { FleetStats } from "@/components/fleet-stats"
import { AlertTriangle, Factory, Loader2 } from "lucide-react"

// Gráficos
import MachinesStatusChart from "@/components/charts/MachinesStatusChart"
import SensorLineChart from "@/components/charts/SensorLineChart"

export default function DashboardPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] Iniciando suscripción a datos en tiempo real")

    const unsubscribe = FirestoreService.subscribeMachines((updatedMachines) => {
      console.log("[v0] Máquinas actualizadas:", updatedMachines.length)
      setMachines(updatedMachines)
      setLoading(false)
    })

    // Cargar alertas
    const loadAlerts = async () => {
      const alertsData = await FirestoreService.getAlerts()
      setAlerts(alertsData)
    }
    loadAlerts()

    return () => {
      console.log("[v0] Cerrando suscripción a Firestore")
      unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Conectando con sensores IoT...</p>
        </div>
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <Factory className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No hay máquinas registradas</h3>
          <p className="text-muted-foreground text-sm">
            Las máquinas aparecerán aquí cuando los dispositivos ESP32 comiencen a enviar datos a Firebase.
          </p>
        </div>
      </div>
    )
  }

  // Estadísticas generales
  const operationalCount = machines.filter((m) => m.status === "operational").length
  const warningCount = machines.filter((m) => m.status === "warning").length
  const criticalCount = machines.filter((m) => m.status === "critical").length
  const avgEfficiency = Math.round(machines.reduce((acc, m) => acc + m.efficiency, 0) / machines.length) || 0

  // ----------------------
  // Transformar datos para gráficos
  // ----------------------

  // 1. Estado de Maquinaria (MachinesStatusChart)
  const chartMachines = machines.map(m => ({
    id: m.id,
    name: m.name,
    value: m.efficiency,   // indicador a mostrar
    warning: 70,           // umbral de advertencia
    critical: 90,          // umbral crítico
  }))

  // 2. Datos de Sensores (SensorLineChart)
  const sensorData = machines.flatMap(m =>
    m.sensors?.map(s => ({
      timestamp: s.timestamp,
      value: s.vibrationRMS, // indicador a mostrar
      machineName: m.name,
    })) || []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel General</h1>
        <p className="text-muted-foreground mt-1">Monitoreo en tiempo real de la flota de maquinaria</p>
      </div>

      {/* Fleet Statistics */}
      <FleetStats
        totalMachines={machines.length}
        operational={operationalCount}
        warning={warningCount}
        critical={criticalCount}
        avgEfficiency={avgEfficiency}
      />

      {/* Gráfico de Estado de Maquinaria */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Estado de Maquinaria</h2>
        <MachinesStatusChart machines={chartMachines} />
      </div>

      {/* Gráfico de Sensores */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Sensores en Tiempo Real</h2>
        <SensorLineChart data={sensorData} label="Vibración RMS" />
      </div>

      {/* Alertas recientes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-chart-5" />
              Alertas Recientes
            </CardTitle>
            <CardDescription>{alerts.filter((a) => !a.acknowledged).length} alertas sin reconocer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          Estado de la Flota
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      </div>
    </div>
  )
}
