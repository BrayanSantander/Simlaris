"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserRole, UserRoleType } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Shield, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { PermissionsService } from "@/lib/services/permissions-service"

export default function UsersPage() {
  const { userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (authLoading) return

    const loadUsers = async () => {
      try {
        setLoading(true)
        const usersSnapshot = await getDocs(collection(db, "users"))
        const usersData = usersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserRole[]
        setUsers(usersData)
      } catch (error) {
        console.error("[v0] Error cargando usuarios:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (userRole?.role === "supervisor_mecanico") {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [userRole, authLoading, toast])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userRole || userRole.role !== "supervisor_mecanico") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Acceso Restringido</h2>
          <p className="text-muted-foreground">Solo el Supervisor Mecánico puede gestionar usuarios.</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleChangeRole = async (userId: string, newRole: UserRoleType) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { role: newRole })

      setUsers(users.map((user) => (user.uid === userId ? { ...user, role: newRole } : user)))

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario se ha actualizado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error actualizando rol:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleStats = {
    supervisor_mecanico: users.filter((u) => u.role === "supervisor_mecanico").length,
    tecnico_mecanico: users.filter((u) => u.role === "tecnico_mecanico").length,
    jefe_operaciones: users.filter((u) => u.role === "jefe_operaciones").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">Administración de usuarios y control de acceso desde Firebase</p>
        </div>
      </div>

      {/* Stats - Solo 3 roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Usuarios</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Supervisores Mecánicos</CardDescription>
            <CardTitle className="text-3xl">{roleStats.supervisor_mecanico}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Técnicos Mecánicos</CardDescription>
            <CardTitle className="text-3xl">{roleStats.tecnico_mecanico}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Jefes de Operaciones</CardDescription>
            <CardTitle className="text-3xl">{roleStats.jefe_operaciones}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista de usuarios registrados en Firebase - Cambia roles directamente desde aquí
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead>Cambiar Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No se encontraron usuarios. Crea usuarios desde la página de registro.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  return (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PermissionsService.getRoleBadgeColor(user.role)}>
                          {PermissionsService.getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRoleType) => handleChangeRole(user.uid, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supervisor_mecanico">Supervisor Mecánico</SelectItem>
                            <SelectItem value="tecnico_mecanico">Técnico Mecánico</SelectItem>
                            <SelectItem value="jefe_operaciones">Jefe de Operaciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Info - Solo 3 roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permisos por Rol
          </CardTitle>
          <CardDescription>Descripción de los permisos de cada nivel de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <h3 className="font-semibold text-blue-500 mb-2">Supervisor Mecánico</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Acceso total al sistema</li>
                <li>Gestión de usuarios y roles</li>
                <li>Configuración de umbrales y asociación de sensores</li>
                <li>Sistema de chat para coordinar compra de repuestos</li>
                <li>Visualización de todos los datos, gráficos y reportes</li>
                <li>Monitoreo de equipos y mantenimiento predictivo</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
              <h3 className="font-semibold text-green-500 mb-2">Técnico Mecánico</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Monitoreo de equipos en tiempo real</li>
                <li>Visualización de gráficos y métricas</li>
                <li>Acceso a sensores y datos históricos</li>
                <li>Vista de alertas (solo lectura)</li>
                <li>Sin acceso a configuración ni chat</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <h3 className="font-semibold text-purple-500 mb-2">Jefe de Operaciones</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Sistema de mensajería con supervisor mecánico</li>
                <li>Solicitud y coordinación de compra de repuestos</li>
                <li>Visualización de gráficos operativos</li>
                <li>Dashboard de resumen</li>
                <li>Sin acceso a monitoreo de máquinas ni configuración</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
