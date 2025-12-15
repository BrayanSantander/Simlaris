"use client"

import SensorLineChart from "@/components/charts/SensorLineChart"
import MachinesStatusChart from "@/components/charts/MachinesStatusChart"

export function SensorCharts() {
  const sensorData = [
    { timestamp: "10:00", value: 22 },
    { timestamp: "10:05", value: 25 },
    { timestamp: "10:10", value: 28 },
    { timestamp: "10:15", value: 24 },
  ]

  const machines = [
    {
      id: "1",
      name: "Scoop LH514",
      value: 75,
      warning: 60,
      critical: 85,
    },
    {
      id: "2",
      name: "Jumbo DD321",
      value: 45,
      warning: 60,
      critical: 85,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SensorLineChart data={sensorData} label="Temperatura (°C)" />
      <MachinesStatusChart machines={machines} />
    </div>
  )
}
