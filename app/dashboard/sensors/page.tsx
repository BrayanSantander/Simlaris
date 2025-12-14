"use client"

interface UnassignedSensor {
  id: string
  lastData: any
  lastTimestamp: number
  dataCount: number
}

export default function SensorsPageRedirect() {
  return null
}

// const loadData = async () => {
//   try {
//     setLoading(true)
//     const [machinesData, sensorsData] = await Promise.all([
//       FirestoreService.getMachines(),
//       SensorService.getUnassignedSensors(),
//     ])
//     setMachines(machinesData)
//     setUnassignedSensors(sensorsData)
//   } catch (err) {
//     console.error("[v0] Error cargando datos:", err)
//     setError("Error al cargar datos")
//   } finally {
//     setLoading(false)
//   }
// }

// const handleAssociateSensor = async () => {
//   if (!sensorId || !selectedMachine) {
//     setError("Debes seleccionar una máquina e ingresar el ID del sensor")
//     return
//   }

//   try {
//     setError("")
//     setSuccess(false)
//     await SensorService.associateSensorToMachine(sensorId, selectedMachine)
//     setSuccess(true)
//     setSensorId("")
//     setSelectedMachine("")

//     // Recargar datos
//     setTimeout(() => {
//       loadData()
//       setSuccess(false)
//     }, 2000)
//   } catch (err) {
//     console.error("[v0] Error asociando sensor:", err)
//     setError("Error al asociar sensor. Verifica que el ID sea correcto.")
//   }
// }

// if (!user) {
//   return (
//     <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
//       <p className="text-muted-foreground">Debes iniciar sesión para acceder a esta página</p>
//     </div>
//   )
// }

// if (userData?.role !== "supervisor_mecanico") {
//   return (
//     <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
//       <p className="text-muted-foreground">Solo el Supervisor Mecánico puede acceder a esta página</p>
//     </div>
//   )
// }

// return (
//   <div className="space-y-6">
//     <div>
//       <h1 className="text-3xl font-bold text-foreground">Configuración de Sensores</h1>
//       <p className="text-muted-foreground mt-2">Asocia sensores IoT a las máquinas del sistema</p>
//     </div>

//     {/* Instrucciones */}
//     <Alert>
//       <Settings className="h-4 w-4" />
//       <AlertDescription>
//         <strong>¿Cómo funciona?</strong> Los sensores ESP32 envían datos a Firestore con un ID único. Aquí puedes
//         asociar ese ID a una máquina específica para que los datos aparezcan en el dashboard.
//       </AlertDescription>
//     </Alert>

//     {/* Formulario de asociación */}
//     <Card>
//       <CardHeader>
//         <CardTitle>Asociar Nuevo Sensor</CardTitle>
//         <CardDescription>Conecta un sensor ESP32 a una máquina del sistema</CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="space-y-2">
//           <Label htmlFor="sensorId">ID del Sensor (ESP32)</Label>
//           <Input
//             id="sensorId"
//             placeholder="Ej: ESP32-A1B2C3D4"
//             value={sensorId}
//             onChange={(e) => setSensorId(e.target.value)}
//           />
//           <p className="text-sm text-muted-foreground">Este ID debe coincidir con el configurado en tu ESP32</p>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="machine">Máquina</Label>
//           <Select value={selectedMachine} onValueChange={setSelectedMachine}>
//             <SelectTrigger>
//               <SelectValue placeholder="Selecciona una máquina" />
//             </SelectTrigger>
//             <SelectContent>
//               {machines.map((machine) => (
//                 <SelectItem key={machine.id} value={machine.id}>
//                   {machine.name} - {machine.type}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {error && (
//           <Alert variant="destructive">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {success && (
//           <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
//             <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
//             <AlertDescription className="text-green-700 dark:text-green-300">
//               ¡Sensor asociado correctamente!
//             </AlertDescription>
//           </Alert>
//         )}

//         <Button onClick={handleAssociateSensor} className="w-full" disabled={!sensorId || !selectedMachine}>
//           Asociar Sensor
//         </Button>
//       </CardContent>
//     </Card>

//     {/* Sensores sin asignar */}
//     <Card>
//       <CardHeader>
//         <CardTitle>Sensores Detectados sin Asignar</CardTitle>
//         <CardDescription>
//           Estos sensores están enviando datos pero no están asociados a ninguna máquina
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         {loading ? (
//           <p className="text-muted-foreground text-center py-4">Cargando...</p>
//         ) : unassignedSensors.length === 0 ? (
//           <div className="text-center py-8">
//             <WifiOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//             <p className="text-muted-foreground">No hay sensores sin asignar</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {unassignedSensors.map((sensor) => (
//               <div key={sensor.id} className="flex items-center justify-between p-4 border rounded-lg">
//                 <div className="flex items-center gap-3">
//                   <Wifi className="h-5 w-5 text-primary" />
//                   <div>
//                     <p className="font-medium">{sensor.id}</p>
//                     <p className="text-sm text-muted-foreground">
//                       {sensor.dataCount} lecturas • Último dato hace{" "}
//                       {Math.round((Date.now() - sensor.lastTimestamp) / 60000)} min
//                     </p>
//                   </div>
//                 </div>
//                 <Button size="sm" onClick={() => setSensorId(sensor.id)}>
//                   Usar este ID
//                 </Button>
//               </div>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>

//     {/* Máquinas con sensores asignados */}
//     <Card>
//       <CardHeader>
//         <CardTitle>Máquinas Configuradas</CardTitle>
//         <CardDescription>Estado de conexión de sensores por máquina</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-3">
//           {machines.map((machine) => {
//             const isActive = machine.lastUpdate > Date.now() - 5 * 60 * 1000 // Activo en últimos 5 min
//             return (
//               <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
//                 <div className="flex items-center gap-3">
//                   {isActive ? (
//                     <Wifi className="h-5 w-5 text-green-500" />
//                   ) : (
//                     <WifiOff className="h-5 w-5 text-gray-400" />
//                   )}
//                   <div>
//                     <p className="font-medium">{machine.name}</p>
//                     <p className="text-sm text-muted-foreground">
//                       {machine.brand} {machine.model} ({machine.year})
//                     </p>
//                   </div>
//                 </div>
//                 <Badge variant={isActive ? "default" : "secondary"}>
//                   {isActive ? "Activo" : "Sin datos recientes"}
//                 </Badge>
//               </div>
//             )
//           })}
//         </div>
//       </CardContent>
//     </Card>
//   </div>
// )
