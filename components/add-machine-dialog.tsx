"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Loader2, Factory } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Machine } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddMachineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMachineDialog({ open, onOpenChange }: AddMachineDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Datos básicos de la máquina
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [location, setLocation] = useState("")
  const [type, setType] = useState("excavadora")

  // Umbrales de sensores
  const [maxPressure, setMaxPressure] = useState("145")
  const [maxTemperature, setMaxTemperature] = useState("80")
  const [maxHumidity, setMaxHumidity] = useState("85")
  const [maxAcceleration, setMaxAcceleration] = useState("2.0")
  const [maxGyroscope, setMaxGyroscope] = useState("250")

  const resetForm = () => {
    setName("")
    setBrand("")
    setModel("")
    setYear("")
    setLocation("")
    setType("excavadora")
    setMaxPressure("145")
    setMaxTemperature("80")
    setMaxHumidity("85")
    setMaxAcceleration("2.0")
    setMaxGyroscope("250")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const newMachine: Omit<Machine, "id"> = {
        name,
        brand,
        model,
        year: Number.parseInt(year),
        location,
        type,
        status: "offline",
        thresholds: {
          maxPressurePSI: Number.parseFloat(maxPressure),
          maxTemperature: Number.parseFloat(maxTemperature),
          maxHumidity: Number.parseFloat(maxHumidity),
          maxAcceleration: Number.parseFloat(maxAcceleration),
          maxGyroscope: Number.parseFloat(maxGyroscope),
        },
        currentData: {
          vibrationX: 0,
          vibrationY: 0,
          vibrationZ: 0,
          vibrationRMS: 0,
          gyroscopeX: 0,
          gyroscopeY: 0,
          gyroscopeZ: 0,
          pressure: 0,
          temperature: 0,
          humidity: 0,
          timestamp: Date.now(),
        },
        efficiency: 0,
        riskScore: 0,
        lastUpdate: Date.now(),
        totalOperationalHours: 0,
        totalDowntimeHours: 0,
      }

      await FirestoreService.createMachine(newMachine)
      resetForm()
      onOpenChange(false)
    } catch (err: any) {
      console.error("[v0] Error al crear máquina:", err)
      setError("Error al crear la máquina. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Agregar Nueva Máquina</DialogTitle>
              <DialogDescription>
                Registra una nueva máquina con sus umbrales de monitoreo personalizados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="ej: Excavadora Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={setType} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excavadora">Excavadora</SelectItem>
                    <SelectItem value="grua">Grúa</SelectItem>
                    <SelectItem value="tractor">Tractor</SelectItem>
                    <SelectItem value="bulldozer">Bulldozer</SelectItem>
                    <SelectItem value="cargador">Cargador</SelectItem>
                    <SelectItem value="compresor">Compresor</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Marca <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  placeholder="ej: Caterpillar"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  Modelo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  placeholder="ej: 320D"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">
                  Año <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="ej: 2020"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  disabled={loading}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">
                  Ubicación <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="ej: Planta Norte, Sector A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Umbrales de Sensores</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Define los límites máximos para generar alertas automáticas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPressure">Presión Hidráulica Máxima (PSI)</Label>
                <Input
                  id="maxPressure"
                  type="number"
                  step="0.1"
                  placeholder="145"
                  value={maxPressure}
                  onChange={(e) => setMaxPressure(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTemperature">Temperatura Máxima (°C)</Label>
                <Input
                  id="maxTemperature"
                  type="number"
                  step="0.1"
                  placeholder="80"
                  value={maxTemperature}
                  onChange={(e) => setMaxTemperature(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHumidity">Humedad Máxima (%)</Label>
                <Input
                  id="maxHumidity"
                  type="number"
                  step="0.1"
                  placeholder="85"
                  value={maxHumidity}
                  onChange={(e) => setMaxHumidity(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAcceleration">Aceleración Máxima (g)</Label>
                <Input
                  id="maxAcceleration"
                  type="number"
                  step="0.01"
                  placeholder="2.0"
                  value={maxAcceleration}
                  onChange={(e) => setMaxAcceleration(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGyroscope">Giroscopio Máximo (°/s)</Label>
                <Input
                  id="maxGyroscope"
                  type="number"
                  step="1"
                  placeholder="250"
                  value={maxGyroscope}
                  onChange={(e) => setMaxGyroscope(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Máquina"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
