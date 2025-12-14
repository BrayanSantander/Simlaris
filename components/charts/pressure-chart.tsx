"use client"

import type { SensorData } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Gauge } from "lucide-react"

interface PressureChartProps {
  data: SensorData[]
  maxPressurePSI?: number
}

export function PressureChart({ data, maxPressurePSI = 145 }: PressureChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presión Hidráulica</CardTitle>
          <CardDescription>Monitoreo de presión del sistema hidráulico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Gauge className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Sin datos históricos</p>
            <p className="text-xs mt-1">Los datos aparecerán cuando el ESP32 envíe información</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    time: format(d.timestamp, "HH:mm:ss", { locale: es }),
    Presión: (d.pressure * 145.038).toFixed(2),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presión Hidráulica</CardTitle>
        <CardDescription>Monitoreo de presión del sistema hidráulico en PSI</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Presión (PSI)",
                angle: -90,
                position: "insideLeft",
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
            <ReferenceLine
              y={maxPressurePSI}
              stroke="hsl(var(--chart-5))"
              strokeDasharray="3 3"
              label={{ value: "Máximo", fill: "hsl(var(--chart-5))" }}
            />
            <Area
              type="monotone"
              dataKey="Presión"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPressure)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
