"use client"

import type { SensorData } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Activity } from "lucide-react"

interface VibrationChartProps {
  data: SensorData[]
}

export function VibrationChart({ data }: VibrationChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vibración Triaxial en Tiempo Real</CardTitle>
          <CardDescription>Monitoreo de aceleración en los tres ejes (X, Y, Z) y RMS calculado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Sin datos históricos</p>
            <p className="text-xs mt-1">Los datos aparecerán cuando el ESP32 envíe información</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    time: format(d.timestamp, "HH:mm:ss", { locale: es }),
    "Eje X": d.vibrationX,
    "Eje Y": d.vibrationY,
    "Eje Z": d.vibrationZ,
    RMS: d.vibrationRMS,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vibración Triaxial en Tiempo Real</CardTitle>
        <CardDescription>Monitoreo de aceleración en los tres ejes (X, Y, Z) y RMS calculado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Aceleración (g)",
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
            <Legend />
            <Line type="monotone" dataKey="Eje X" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Eje Y" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Eje Z" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="RMS" stroke="hsl(var(--chart-5))" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
