"use client"

import type { SensorData } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Thermometer } from "lucide-react"

interface TemperatureHumidityChartProps {
  data: SensorData[]
}

export function TemperatureHumidityChart({ data }: TemperatureHumidityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Condiciones Ambientales</CardTitle>
          <CardDescription>Temperatura y humedad relativa del entorno de operación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Thermometer className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Sin datos históricos</p>
            <p className="text-xs mt-1">Los datos aparecerán cuando el ESP32 envíe información</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    time: format(d.timestamp, "HH:mm:ss", { locale: es }),
    Temperatura: d.temperature,
    Humedad: d.humidity,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Condiciones Ambientales</CardTitle>
        <CardDescription>Temperatura y humedad relativa del entorno de operación</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Temperatura (°C)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Humedad (%)",
                angle: 90,
                position: "insideRight",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Temperatura"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Humedad"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
