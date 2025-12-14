"use client"

import { useEffect, useState } from "react"
import type { Machine } from "@/lib/types"
import { FirestoreService } from "@/lib/services/firestore-service"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MachineCard } from "@/components/machine-card"
import { Search, Factory, Plus, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddMachineDialog } from "@/components/add-machine-dialog"

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = FirestoreService.subscribeMachines((machinesData) => {
      setMachines(machinesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.model?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || machine.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Máquinas</h1>
          <p className="text-muted-foreground mt-1">Monitoreo individual y análisis detallado de cada máquina</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Máquina
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, marca, modelo o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="operational">Operacional</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="offline">Fuera de línea</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredMachines.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Factory className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay máquinas registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera máquina para empezar a monitorear datos en tiempo real.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Primera Máquina
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Factory className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {filteredMachines.length} {filteredMachines.length === 1 ? "Máquina" : "Máquinas"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMachines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
      )}

      <AddMachineDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}
