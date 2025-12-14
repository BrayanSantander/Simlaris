"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/use-auth"

export default function SettingsPage() {
  const { userRole } = useAuth()
  const [saved, setSaved] = useState(false)

  // Estado de umbrales por defecto
  const [thresholds, setThresholds] = useState({
    vibrationRMSMax: 1.0,
    pressureMax: 1.0,
    temperatureMax: 85,
    humidityMax: 80,
  })

  const handleSave = () => {
    // Aquí se guardaría en Firestore
    console.log("[v0] Guardando umbrales:", thresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (userRole?.role !== "supervisor_mecanico") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Acceso Restringido</h2>
          <p className="text-muted-foreground">Solo el Supervisor Mecánico puede acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configuración del Sistema
        </h1>
        <p className="text-muted-foreground mt-1">Gestión de umbrales y parámetros de alertas</p>
      </div>

      {saved && (
        <Alert className="bg-chart-3/10 border-chart-3">
          <AlertDescription className="text-chart-3">Configuración guardada correctamente</AlertDescription>
        </Alert>
      )}

      {/* Threshold Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Umbrales de Alertas Globales</CardTitle>
          <CardDescription>Configuración de valores límite para generación automática de alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vibración */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="vibrationRMSMax" className="text-base font-semibold">
                Vibración RMS Máxima
              </Label>
              <Badge variant="outline">Sistema crítico</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Input
                id="vibrationRMSMax"
                type="number"
                step="0.1"
                value={thresholds.vibrationRMSMax}
                onChange={(e) =>
                  setThresholds((prev) => ({
                    ...prev,
                    vibrationRMSMax: Number.parseFloat(e.target.value),
                  }))
                }
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">g (aceleración)</span>
            </div>
            <p className="text-sm text-muted-foreground">Alertas se generan al superar el 80% de este valor</p>
          </div>

          <Separator />

          {/* Presión */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pressureMax" className="text-base font-semibold">
                Presión Hidráulica Máxima
              </Label>
              <Badge variant="outline">Sistema crítico</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Input
                id="pressureMax"
                type="number"
                step="0.1"
                value={thresholds.pressureMax}
                onChange={(e) =>
                  setThresholds((prev) => ({
                    ...prev,
                    pressureMax: Number.parseFloat(e.target.value),
                  }))
                }
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">MPa</span>
            </div>
            <p className="text-sm text-muted-foreground">Alertas se generan al superar el 90% de este valor</p>
          </div>

          <Separator />

          {/* Temperatura */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperatureMax" className="text-base font-semibold">
                Temperatura Máxima
              </Label>
              <Badge variant="outline">Monitoreo ambiental</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Input
                id="temperatureMax"
                type="number"
                step="1"
                value={thresholds.temperatureMax}
                onChange={(e) =>
                  setThresholds((prev) => ({
                    ...prev,
                    temperatureMax: Number.parseFloat(e.target.value),
                  }))
                }
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">°C</span>
            </div>
            <p className="text-sm text-muted-foreground">Alertas se generan al superar el 85% de este valor</p>
          </div>

          <Separator />

          {/* Humedad */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="humidityMax" className="text-base font-semibold">
                Humedad Máxima
              </Label>
              <Badge variant="outline">Monitoreo ambiental</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Input
                id="humidityMax"
                type="number"
                step="1"
                value={thresholds.humidityMax}
                onChange={(e) =>
                  setThresholds((prev) => ({
                    ...prev,
                    humidityMax: Number.parseFloat(e.target.value),
                  }))
                }
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-sm text-muted-foreground">Alertas se generan al superar este valor</p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Critical Frequencies */}
      <Card>
        <CardHeader>
          <CardTitle>Frecuencias Críticas</CardTitle>
          <CardDescription>
            Configuración de frecuencias de resonancia críticas para detección de anomalías
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="criticalFreqs" className="text-base font-semibold">
              Frecuencias de Alerta (Hz)
            </Label>
            <Input
              id="criticalFreqs"
              type="text"
              placeholder="10, 25, 40, 60"
              defaultValue="10, 25, 40, 60"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">Ingresa las frecuencias separadas por comas</p>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Save className="h-4 w-4" />
            Guardar frecuencias
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
