"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SensorLineChart } from "@/components/charts/SensorLineChart"
import MachinesStatusChart from "@/components/charts/MachinesStatusChart"

interface SensorChartsProps {
  machines: any[]
}

export function SensorCharts({ machines }: SensorChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoreo de Sensores</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de sensores */}
        <SensorLineChart machines={machines} />

        {/* Estado de máquinas */}
        <MachinesStatusChart machines={machines} />
      </CardContent>
    </Card>
  )
}
