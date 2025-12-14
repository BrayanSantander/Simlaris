"use client"

import React, { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { FirestoreService } from "@/lib/services/firestore-service"
import type { Machine } from "@/lib/types"

export default function DashboardPage() {
  const [machines, setMachines] = useState<Machine[]>([])

  // Simulación de datos de gráficos por máquina
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = FirestoreService.subscribeMachines((machinesData) => {
      setMachines(machinesData)

      // Crear datos de ejemplo para el gráfico por máquina
      const data = machinesData.map((m, i) => ({
        name: m.name,
        production: Math.floor(Math.random() * 500) + 100,
        downtime: Math.floor(Math.random() * 50),
      }))
      setChartData(data)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Panel General</h1>
      <p className="text-muted-foreground">
        Visualización de datos de producción y tiempo de inactividad por máquina
      </p>

      {machines.length === 0 ? (
        <p>No hay máquinas registradas aún.</p>
      ) : (
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">Producción y tiempo de inactividad</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="production" stroke="#8884d8" />
              <Line type="monotone" dataKey="downtime" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
