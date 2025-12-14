'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Datos de ejemplo para el gráfico
const exampleData = [
  { name: 'Ene', valor: 400 },
  { name: 'Feb', valor: 300 },
  { name: 'Mar', valor: 500 },
  { name: 'Abr', valor: 200 },
  { name: 'May', valor: 278 },
]

export default function DashboardPage() {
  // Aquí puedes agregar estado para datos dinámicos
  const [chartData, setChartData] = useState(exampleData)

  useEffect(() => {
    // Simulación de actualización de datos desde Firebase o API
    // setChartData(fetchDatos())
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>Panel General</h1>

      {/* Contenedor del gráfico */}
      <div style={{ width: '100%', height: 400, marginBottom: '40px' }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="valor" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Aquí puedes agregar más gráficos */}
      <div style={{ width: '100%', height: 400 }}>
        <p>Otros gráficos se pueden agregar aquí</p>
      </div>
    </div>
  )
}
