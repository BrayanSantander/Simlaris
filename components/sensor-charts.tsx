"use client"

import SensorLineChart from "@/components/charts/SensorLineChart"
import MachinesStatusChart from "@/components/charts/MachinesStatusChart"

export function SensorCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SensorLineChart />
      <MachinesStatusChart />
    </div>
  )
}
