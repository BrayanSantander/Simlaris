"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/use-auth"
import { FirestoreService } from "@/lib/services/firestore-service"
import type { Machine } from "@/lib/types"
import { Settings, Database, LinkIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, limit, query, updateDoc, doc } from "firebase/firestore"

export default function ConfigPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para asociar colección
  const [selectedMachineForCollection, setSelectedMachineForCollection] = useState("")
  const [collectionName, setCollectionName] = useState("")
  const [associating, setAssociating] = useState(false)
  const [associationResult, setAssociationResult] = useState<{ success: boolean; message: string } | null>(null)

  // Estado para editar umbrales
  const [selectedMachineForThresholds, setSelectedMachineForThresholds] = useState("")
  const [thresholds, setThresholds] = useState({
    maxPressurePSI: 0,
    maxTemperature: 0,
    maxHumidity: 0,
    maxAcceleration: 0,
    maxGyroscope: 0,
  })

  useEffect(() => {
    if (authLoading) return
    if (!userRole || userRole.role !== "supervisor_mecanico") {
      setLoading(false)
      return
    }
    loadMachines()
  }, [userRole, authLoading])

  const loadMachines = async () => {
    setLoading(true)
    const machinesData = await FirestoreService.getMachines()
    setMachines(machinesData)
    setLoading(false)
  }

  const handleAssociateCollection = async () => {
    if (!selectedMachineForCollection || !collectionName.trim()) {
      setAssociationResult({
        success: false,
        message: "Por favor selecciona una máquina e ingresa el nombre del grupo de sensores",
      })
      return
    }

    setAssociating(true)
    setAssociationResult(null)

    try {
      // Verificar que la colección existe y tiene datos
      console.log("[v0] Verificando grupo de sensores:", collectionName)
      const testQuery = query(collection(db, collectionName), limit(1))
      const testSnapshot = await getDocs(testQuery)

      if (testSnapshot.empty) {
        setAssociationResult({
          success: false,
          message: `El grupo de sensores "${collectionName}" no existe o está vacío en la base de datos`,
        })
        setAssociating(false)
        return
      }

      // Asociar la colección a la máquina
      const machineRef = doc(db, "machines", selectedMachineForCollection)
      console.log("[v0] Actualizando máquina:", selectedMachineForCollection, "con grupo:", collectionName)
      await updateDoc(machineRef, {
        sensorCollectionName: collectionName,
      })

      console.log("[v0] Grupo de sensores asociado exitosamente")
      setAssociationResult({
        success: true,
        message: `Grupo de sensores "${collectionName}" asociado exitosamente. Los datos ahora se leerán desde este grupo.`,
      })

      // Recargar máquinas
      await loadMachines()

      // Limpiar formulario
      setCollectionName("")
      setSelectedMachineForCollection("")
    } catch (error: any) {
      console.error("[v0] Error al asociar grupo de sensores:", error)
      setAssociationResult({
        success: false,
        message: `Error: ${error.message || "No se pudo asociar el grupo de sensores"}`,
      })
    } finally {
      setAssociating(false)
    }
  }

  const handleUpdateThresholds = async () => {
    if (!selectedMachineForThresholds) return

    try {
      const machineRef = doc(db, "machines", selectedMachineForThresholds)
      await updateDoc(machineRef, {
        thresholds: thresholds,
      })

      setAssociationResult({
        success: true,
        message: "Umbrales actualizados exitosamente",
      })
      await loadMachines()
    } catch (error) {
      console.error("[v0] Error al actualizar umbrales:", error)
      setAssociationResult({
        success: false,
        message: "Error al actualizar umbrales",
      })
    }
  }

  const handleSelectMachineForThresholds = (machineId: string) => {
    setSelectedMachineForThresholds(machineId)
    const machine = machines.find((m) => m.id === machineId)
    if (machine && machine.thresholds) {
      setThresholds(machine.thresholds)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  if (userRole.role !== "supervisor_mecanico") {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acceso denegado. Solo el Supervisor Mecánico puede acceder a esta página.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Gestiona las asociaciones de sensores y umbrales de las máquinas</p>
      </div>

      <Tabs defaultValue="associate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="associate">Asociar Grupo de Sensores</TabsTrigger>
          <TabsTrigger value="thresholds">Editar Umbrales</TabsTrigger>
        </TabsList>

        {/* Tab: Asociar Grupo de Sensores */}
        <TabsContent value="associate" className="space-y-6">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Cómo funciona?</strong> Especifica el nombre de tu grupo de sensores donde se guardan los datos
              en tiempo real. El sistema leerá automáticamente desde ese grupo para esta máquina.
            </AlertDescription>
          </Alert>

          {/* Formulario de asociación */}
          <Card>
            <CardHeader>
              <CardTitle>Asociar Grupo de Sensores</CardTitle>
              <CardDescription>Conecta un grupo completo de datos de sensores a una máquina específica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collectionName">Nombre del Grupo de Sensores</Label>
                <Input
                  id="collectionName"
                  placeholder="Ej: sensor_bomba_1, mediciones_compresor, datos_motor_principal"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Ingresa el nombre exacto del grupo donde tus sensores están guardando los datos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="machineForCollection">Máquina</Label>
                <Select value={selectedMachineForCollection} onValueChange={setSelectedMachineForCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name} - {machine.brand} {machine.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssociateCollection}
                className="w-full"
                disabled={!collectionName.trim() || !selectedMachineForCollection || associating}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {associating ? "Asociando..." : "Asociar Grupo de Sensores"}
              </Button>

              {/* Resultado de la asociación */}
              {associationResult && (
                <Alert variant={associationResult.success ? "default" : "destructive"}>
                  {associationResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{associationResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Máquinas con grupos asociados */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Asociaciones</CardTitle>
              <CardDescription>Revisa qué máquinas tienen grupos de sensores asociados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Cargando...</p>
              ) : machines.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay máquinas registradas</p>
              ) : (
                <div className="space-y-3">
                  {machines.map((machine) => (
                    <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {machine.name} - {machine.brand} {machine.model}
                          </p>
                          {machine.sensorCollectionName ? (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Grupo: <span className="font-mono">{machine.sensorCollectionName}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sin grupo asociado</p>
                          )}
                        </div>
                      </div>
                      {machine.sensorCollectionName && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Editar Umbrales */}
        <TabsContent value="thresholds" className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configura los valores máximos permitidos para cada sensor. Si se superan estos umbrales, el sistema
              generará alertas automáticas.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Editar Umbrales por Máquina</CardTitle>
              <CardDescription>Selecciona una máquina y ajusta sus límites operacionales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="machineForThresholds">Máquina</Label>
                <Select value={selectedMachineForThresholds} onValueChange={handleSelectMachineForThresholds}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name} - {machine.brand} {machine.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMachineForThresholds && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxPressurePSI">Presión Máxima (PSI)</Label>
                      <Input
                        id="maxPressurePSI"
                        type="number"
                        value={thresholds.maxPressurePSI}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, maxPressurePSI: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTemperature">Temperatura Máxima (°C)</Label>
                      <Input
                        id="maxTemperature"
                        type="number"
                        value={thresholds.maxTemperature}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, maxTemperature: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxHumidity">Humedad Máxima (%)</Label>
                      <Input
                        id="maxHumidity"
                        type="number"
                        value={thresholds.maxHumidity}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, maxHumidity: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxAcceleration">Aceleración Máxima (m/s²)</Label>
                      <Input
                        id="maxAcceleration"
                        type="number"
                        step="0.1"
                        value={thresholds.maxAcceleration}
                        onChange={(e) =>
                          setThresholds((prev) => ({ ...prev, maxAcceleration: Number(e.target.value) }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxGyroscope">Giroscopio Máximo (rad/s)</Label>
                      <Input
                        id="maxGyroscope"
                        type="number"
                        step="0.1"
                        value={thresholds.maxGyroscope}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, maxGyroscope: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleUpdateThresholds} className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Guardar Umbrales
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
