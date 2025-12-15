"use client"

import type { SensorData } from "@/lib/types"
import { EfficiencyService } from "@/lib/services/efficiency-service"
import { useEffect, useState } from "react"
import type { Machine, Alert as AlertType } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Card, CardContent } from "@/components/ui/card"
import { MachineCard } from "@/components/machine-card"
import { AlertCard } from "@/components/alert-card"
import { FleetStats } from "@/components/fleet-stats"
import { SensorCharts } from "@/components/sensor-charts"
import { AlertTriangle, Factory, Loader2 } from "lucide-react"

export default function DashboardPage() {
  // -------------------------------
  // 1️⃣ Estados
  // -------------------------------
  const [machines, setMachines] = useState<Machine[]>([])
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [loading, setLoading] = useState(true)
  const [averageEfficiency, setAverageEfficiency] = useState(0)
  const [sensorsByMachine, setSensorsByMachine] = useState<
    Record<string, SensorData[]>
  >({})

  // -------------------------------
  // 2️⃣ useEffect: Máquinas y alertas
  // -------------------------------
  useEffect(() => {
    const unsubscribe = FirestoreService.subscribeMachines((updatedMachines) => {
      setMachines(updatedMachines)
      setLoading(false)
    })

    const loadAlerts = async () => {
      const alertsData = await FirestoreService.getAlerts()
      setAlerts(alertsData)
    }

    loadAlerts()
    const interval = setInterval(loadAlerts, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // -------------------------------
  // 3️⃣ useEffect: Escuchar sensores por máquina
  // -------------------------------
  useEffect(() => {
    if (machines.length === 0) return

    const unsubscribes: (() => void)[] = []

    machines.forEach((machine) => {
      const unsubscribe = FirestoreService.subscribeSensorData(
        machine.id,
        (sensorData) => {
          setSensorsByMachine((prev) => ({
            ...prev,
            [machine.id]: sensorData,
          }))
        }
      )
      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach((u) => u())
    }
  }, [machines])

  // -------------------------------
  // 4️⃣ useEffect: Calcular eficiencia promedio
  // -------------------------------
  useEffect(() => {
    const efficiencies: number[] = []

    Object.entries(sensorsByMachine).forEach(([machineId, sensors]) => {
      const machine = machines.find((m) => m.id === machineId)
      if (!machine) return

      const efficiency =
        EfficiencyService.calculateMachineEfficiency(machine, sensors)

      efficiencies.push(efficiency)
    })

    if (efficiencies.length === 0) {
      setAverageEfficiency(0)
      return
    }

    const avg =
      efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length

    setAverageEfficiency(Math.round(avg))
  }, [sensorsByMachine, machines])

  // -------------------------------
  // 5️⃣ Render
  // -------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel General</h1>
        <p className="text-muted-foreground mt-1">
          Estado general de la flota y sensores en tiempo real
        </p>
      </div>

      {/* Stats */}
      <FleetStats averageEfficiency={averageEfficiency} />

      {/* Charts */}
      <SensorCharts machines={machines} />

      {/* Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-chart-5" />
          <h2 className="text-xl font-semibold">Alertas recientes</h2>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay alertas registradas
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Machines */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Factory className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Máquinas</h2>
        </div>

        {machines.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay máquinas registradas
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
