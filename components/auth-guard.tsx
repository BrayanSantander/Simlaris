"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Loader2 } from "lucide-react"
import type { UserRoleType } from "@/lib/types"
import { PermissionsService } from "@/lib/services/permissions-service"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRoleType
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  console.log("[v0] AuthGuard - user:", user?.email, "userRole:", userRole, "loading:", loading)

  useEffect(() => {
    if (!loading && !user) {
      console.log("[v0] No user, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    console.log("[v0] Still loading authentication...")
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log("[v0] No user authenticated")
    return null
  }

  if (requiredRole && userRole) {
    // Supervisor mecánico siempre tiene acceso completo
    if (userRole.role === "supervisor_mecanico") {
      console.log("[v0] Supervisor mecánico - acceso total garantizado")
      return <>{children}</>
    }

    if (!PermissionsService.hasMinimumLevel(userRole.role, requiredRole)) {
      console.log("[v0] User does not have required permissions")
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tienes permisos suficientes para acceder a esta página.</p>
            <p className="text-sm text-muted-foreground">
              Rol requerido: {PermissionsService.getRoleDisplayName(requiredRole)}
            </p>
            <p className="text-sm text-muted-foreground">
              Tu rol: {PermissionsService.getRoleDisplayName(userRole.role)}
            </p>
          </div>
        </div>
      )
    }
  }

  console.log("[v0] AuthGuard rendering children")
  return <>{children}</>
}
