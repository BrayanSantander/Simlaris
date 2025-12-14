"use client"

import { useEffect, useState } from "react"
import type { Machine, SensorData } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Gauge, Droplets, Thermometer, Wind, ChevronRight, Factory, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { FirestoreService } from "@/lib/services/firestore-service"

interface MachineCardProps {
  machine: Machine
}

export function MachineCard({ machine }: MachineCardProps) {
  const [currentData, setCurrentData] = useState<SensorData | null>(machine.currentData || null)
  const [isOnline, setIsOnline] = useState(machine.status !== "offline")

  console.log("[v0] MachineCard - Machine:", machine.name, "sensorCollectionName:", machine.sensorCollectionName)

  useEffect(() => {
    console.log("[v0] useEffect MachineCard - sensorCollectionName:", machine.sensorCollectionName)

    if (!machine.sensorCollectionName) {
      console.log("[v0] No hay sensorCollectionName, marcando como offline")
      setIsOnline(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      unsubscribe = await FirestoreService.subscribeToLatestSensorData(machine.id, (data) => {
        if (data) {
          setCurrentData(data)
          setIsOnline(true)
        } else {
          setIsOnline(false)
        }
      })
    }

    setupSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [machine.id, machine.sensorCollectionName])

  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-chart-3 bg-chart-3/10"
    if (risk < 70) return "text-chart-4 bg-chart-4/10"
    return "text-chart-5 bg-chart-5/10"
  }

  const pressurePSI = currentData ? (currentData.pressure * 145.038).toFixed(1) : "0.0"

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-none">{machine.name}</h3>
              {isOnline && (
                <div className="flex items-center gap-1 text-chart-3">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span className="text-xs font-medium">En vivo</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {machine.brand} {machine.model} ({machine.year})
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {machine.location}
            </p>
          </div>
          <StatusBadge status={isOnline ? "operational" : "offline"} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOnline && currentData ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Wind className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Vibración RMS</p>
                <p className="text-base font-semibold truncate">{currentData.vibrationRMS.toFixed(3)} g</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <Gauge className="h-4 w-4 text-purple-500" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Presión</p>
                <p className="text-base font-semibold truncate">{pressurePSI} PSI</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className="p-1.5 rounded-md bg-orange-500/10">
                <Thermometer className="h-4 w-4 text-orange-500" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Temperatura</p>
                <p className="text-base font-semibold truncate">{currentData.temperature.toFixed(1)}°C</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className="p-1.5 rounded-md bg-cyan-500/10">
                <Droplets className="h-4 w-4 text-cyan-500" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Humedad</p>
                <p className="text-base font-semibold truncate">{currentData.humidity.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Factory className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Sin datos de sensores</p>
            <p className="text-xs">
              {machine.sensorCollectionName ? "Esperando primera lectura..." : "No hay colección asociada"}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Eficiencia</p>
            <p className="text-sm font-semibold">{machine.efficiency}%</p>
            <p className="text-xs text-muted-foreground">{machine.totalOperationalHours.toFixed(1)}h operativo</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Riesgo</p>
            <Badge className={cn("font-semibold", getRiskColor(machine.riskScore))}>{machine.riskScore}%</Badge>
          </div>
          <Link href={`/dashboard/machines/${machine.id}`}>
            <Button size="sm" variant="ghost" className="gap-1">
              Ver detalles
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
