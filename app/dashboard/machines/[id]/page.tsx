"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Machine, SensorData } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { ArrowLeft, MapPin, Calendar, Loader2, Factory } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function MachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [currentData, setCurrentData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] useEffect ejecutado para máquina:", params.id)

    const loadMachine = async () => {
      console.log("[v0] Cargando información de la máquina...")
      const machineData = await FirestoreService.getMachineById(params.id as string)
      if (machineData) {
        console.log("[v0] Máquina cargada:", machineData.name)
        console.log("[v0] Colección asociada:", machineData.sensorCollectionName || "sensor_data (default)")
        setMachine(machineData)
      } else {
        console.log("[v0] No se encontró la máquina")
      }
      setLoading(false)
    }

    loadMachine()

    let unsubscribe: (() => void) | undefined

    const setupSubscription = async () => {
      console.log("[v0] Iniciando suscripción a datos en tiempo real")
      try {
        unsubscribe = await FirestoreService.subscribeToLatestSensorData(params.id as string, (data) => {
          console.log("[v0] ✓ Datos recibidos del callback:", data ? "SÍ" : "NO")
          if (data) {
            console.log("[v0] Datos recibidos:", {
              timestamp: new Date(data.timestamp).toLocaleString(),
              temperatura: data.temperature,
              presion: data.pressure,
              vibrationRMS: data.vibrationRMS?.toFixed(3),
            })
          }
          setCurrentData(data)
        })
        console.log("[v0] ✓ Suscripción establecida correctamente")
      } catch (error) {
        console.error("[v0] ✗ Error al configurar suscripción:", error)
      }
    }

    setupSubscription()

    return () => {
      console.log("[v0] Cerrando suscripción a Firestore")
      if (unsubscribe) {
        unsubscribe()
        console.log("[v0] ✓ Suscripción cerrada correctamente")
      } else {
        console.log("[v0] ⚠ No había suscripción activa para cerrar")
      }
    }
  }, [params.id])

  if (loading || !machine) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando datos de sensores...</p>
        </div>
      </div>
    )
  }

  const pressurePSI = currentData ? (currentData.pressure * 145.038).toFixed(1) : "0.0"
  const vibrationRMS = currentData?.vibrationRMS?.toFixed(3) || "0.000"
  const temperature = currentData?.temperature?.toFixed(1) || "0.0"
  const humidity = currentData?.humidity?.toFixed(0) || "0"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{machine.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {machine.brand} {machine.model} ({machine.year})
            </p>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {machine.location}
              </span>
              {currentData && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Actualizado{" "}
                  {formatDistanceToNow(currentData.timestamp, {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={currentData ? "operational" : "offline"} />
        </div>
      </div>

      {currentData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Vibración RMS</CardDescription>
                <CardTitle className="text-3xl">{vibrationRMS} g</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Presión Hidráulica</CardDescription>
                <CardTitle className="text-3xl">{pressurePSI} PSI</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Temperatura</CardDescription>
                <CardTitle className="text-3xl">{temperature}°C</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Humedad</CardDescription>
                <CardTitle className="text-3xl">{humidity}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardDescription>Aceleración</CardDescription>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje X:</span>
                    <span className="font-medium">{currentData.accelerationX?.toFixed(3) || "0.000"} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje Y:</span>
                    <span className="font-medium">{currentData.accelerationY?.toFixed(3) || "0.000"} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje Z:</span>
                    <span className="font-medium">{currentData.accelerationZ?.toFixed(3) || "0.000"} g</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Giroscopio</CardDescription>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje X:</span>
                    <span className="font-medium">{currentData.gyroX?.toFixed(2) || "0.00"} °/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje Y:</span>
                    <span className="font-medium">{currentData.gyroY?.toFixed(2) || "0.00"} °/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eje Z:</span>
                    <span className="font-medium">{currentData.gyroZ?.toFixed(2) || "0.00"} °/s</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Estado del Sistema</CardDescription>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium">{machine.efficiency || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Colección:</span>
                    <span className="font-medium text-xs">{machine.sensorCollectionName || "sensor_data"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Última actualización:</span>
                    <span className="font-medium text-xs">
                      {new Date(currentData.timestamp).toLocaleTimeString("es-ES")}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Factory className="h-12 w-12 mb-4 opacity-50" />
              <CardTitle className="text-xl mb-2">Esperando datos en tiempo real</CardTitle>
              <CardDescription className="text-center max-w-md">
                Esperando que el ESP32 envíe datos a la colección "{machine.sensorCollectionName || "sensor_data"}" en
                Firebase. Los datos aparecerán automáticamente cuando estén disponibles.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
