"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import type { Machine } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Activity, Thermometer, Gauge, Droplets } from "lucide-react"

interface SensorChartsProps {
  machines: Machine[]
}

interface ChartDataPoint {
  time: string
  timestamp: number
  vibration: number
  temperature: number
  pressure: number
  humidity: number
  machineName: string
}

export function SensorCharts({ machines }: SensorChartsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChartData = async () => {
      const allData: ChartDataPoint[] = []

      for (const machine of machines) {
        if (machine.sensorCollectionName) {
          const sensorData = await FirestoreService.getSensorData(machine.id, 1) // Última hora

          sensorData.forEach((data) => {
            allData.push({
              time: new Date(data.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp: data.timestamp,
              vibration: Number(data.vibrationRMS.toFixed(4)),
              temperature: Number(data.temperature.toFixed(1)),
              pressure: Number((data.pressure * 145.038).toFixed(1)), // Convertir a PSI
              humidity: Number(data.humidity.toFixed(1)),
              machineName: machine.name,
            })
          })
        }
      }

      // Ordenar por timestamp y tomar los últimos 50 puntos
      const sorted = allData.sort((a, b) => a.timestamp - b.timestamp).slice(-50)
      setChartData(sorted)
      setLoading(false)
    }

    loadChartData()

    // Actualizar cada 30 segundos
    const interval = setInterval(loadChartData, 30000)
    return () => clearInterval(interval)
  }, [machines])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse text-muted-foreground">Cargando gráficos...</div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No hay datos suficientes para mostrar gráficos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Monitoreo en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vibration" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="vibration" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Vibración</span>
            </TabsTrigger>
            <TabsTrigger value="temperature" className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Temperatura</span>
            </TabsTrigger>
            <TabsTrigger value="pressure" className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Presión</span>
            </TabsTrigger>
            <TabsTrigger value="humidity" className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Humedad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vibration" className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVibration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="vibration"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorVibration)"
                  name="Vibración RMS (g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="temperature" className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                  name="Temperatura (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pressure" className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="Presión (PSI)"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="humidity" className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="hsl(var(--chart-3))"
                  fillOpacity={1}
                  fill="url(#colorHumidity)"
                  name="Humedad (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
