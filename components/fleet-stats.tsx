"use client"

import { useEffect, useState } from "react"
import { FirestoreService } from "@/lib/services/firestore-service"
import { EfficiencyService } from "@/lib/services/efficiency-service"
import type { Machine, SensorData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FleetStats() {
  const [efficiency, setEfficiency] = useState<number>(0)

  useEffect(() => {
    const loadEfficiency = async () => {
      const machines = await FirestoreService.getMachines()
      let total = 0
      let count = 0

      for (const machine of machines) {
        const data: SensorData[] =
          await FirestoreService.getLatestSensorData(machine.id, 20)

        if (data.length) {
          total += EfficiencyService.calculateEfficiency(machine, data)
          count++
        }
      }

      setEfficiency(count ? Math.round(total / count) : 0)
    }

    loadEfficiency()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eficiencia Promedio</CardTitle>
      </CardHeader>
      <CardContent className="text-4xl font-bold">
        {efficiency}%
      </CardContent>
    </Card>
  )
}

