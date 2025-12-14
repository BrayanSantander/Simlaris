"use client"

import type { SensorData } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { SensorProcessingService } from "@/lib/services/sensor-processing"
import { AudioWaveform as Waveform } from "lucide-react"

interface FrequencySpectrumChartProps {
  data: SensorData[]
}

export function FrequencySpectrumChart({ data }: FrequencySpectrumChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Frecuencias (FFT)</CardTitle>
          <CardDescription>Espectro de frecuencias para detección de anomalías en vibración</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Waveform className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Sin datos históricos</p>
            <p className="text-xs mt-1">Los datos aparecerán cuando el ESP32 envíe información</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular espectro FFT de los últimos datos RMS
  const rmsData = data.map((d) => d.vibrationRMS)
  const spectrum = SensorProcessingService.calculateFrequencySpectrum(rmsData)

  const chartData = spectrum.map((s) => ({
    Frecuencia: `${s.frequency} Hz`,
    Magnitud: s.magnitude,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Frecuencias (FFT)</CardTitle>
        <CardDescription>Espectro de frecuencias para detección de anomalías en vibración</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="Frecuencia"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval={4}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Magnitud",
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
            <Bar dataKey="Magnitud" fill="hsl(var(--chart-2))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
