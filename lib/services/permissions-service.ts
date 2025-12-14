// Servicio de gestión de permisos por rol

import type { UserRoleType } from "@/lib/types"

export interface RolePermissions {
  acceso: "total" | "limitado"
  modulos: string[]
  descripcion: string
  canAccessChat: boolean
  canManageUsers: boolean
  canConfigureSystem: boolean
  canViewGraphics: boolean
  canMonitorMachines: boolean
}

export class PermissionsService {
  static ROLE_PERMISSIONS: Record<UserRoleType, RolePermissions> = {
    supervisor_mecanico: {
      acceso: "total",
      modulos: [
        "dashboard",
        "machines",
        "sensors",
        "alerts",
        "predictive",
        "config",
        "users",
        "chat",
        "graphics",
        "settings",
      ],
      descripcion: "Acceso total al sistema",
      canAccessChat: true,
      canManageUsers: true,
      canConfigureSystem: true,
      canViewGraphics: true,
      canMonitorMachines: true,
    },
    tecnico_mecanico: {
      acceso: "limitado",
      modulos: ["dashboard", "machines", "sensors", "alerts", "graphics"],
      descripcion: "Monitoreo de equipos y visualización de gráficos",
      canAccessChat: false,
      canManageUsers: false,
      canConfigureSystem: false,
      canViewGraphics: true,
      canMonitorMachines: true,
    },
    jefe_operaciones: {
      acceso: "limitado",
      modulos: ["dashboard", "chat", "graphics"],
      descripcion: "Chat con supervisor mecánico y visualización de gráficos",
      canAccessChat: true,
      canManageUsers: false,
      canConfigureSystem: false,
      canViewGraphics: true,
      canMonitorMachines: false,
    },
  }

  /**
   * Verifica si un rol puede acceder a un módulo específico
   */
  static canAccessModule(role: UserRoleType, moduleName: string): boolean {
    if (role === "supervisor_mecanico") return true
    return this.ROLE_PERMISSIONS[role]?.modulos?.includes(moduleName) || false
  }

  /**
   * Obtiene todos los permisos de un rol
   */
  static getPermissions(role: UserRoleType): RolePermissions {
    return this.ROLE_PERMISSIONS[role]
  }

  /**
   * Verifica si un rol puede acceder al chat
   */
  static canAccessChat(role: UserRoleType): boolean {
    return this.ROLE_PERMISSIONS[role]?.canAccessChat || false
  }

  /**
   * Obtiene la jerarquía numérica de un rol
   */
  static getRoleHierarchy(role: UserRoleType): number {
    const hierarchy: Record<UserRoleType, number> = {
      supervisor_mecanico: 3,
      tecnico_mecanico: 2,
      jefe_operaciones: 1,
    }
    return hierarchy[role] || 0
  }

  /**
   * Verifica si un rol tiene nivel mínimo requerido
   */
  static hasMinimumLevel(userRole: UserRoleType, requiredRole: UserRoleType): boolean {
    return this.getRoleHierarchy(userRole) >= this.getRoleHierarchy(requiredRole)
  }

  /**
   * Obtiene el nombre legible del rol
   */
  static getRoleDisplayName(role: UserRoleType): string {
    const names: Record<UserRoleType, string> = {
      supervisor_mecanico: "Supervisor Mecánico",
      tecnico_mecanico: "Técnico Mecánico",
      jefe_operaciones: "Jefe de Operaciones",
    }
    return names[role] || role
  }

  /**
   * Obtiene el color del badge para cada rol
   */
  static getRoleBadgeColor(role: UserRoleType): string {
    const colors: Record<UserRoleType, string> = {
      supervisor_mecanico: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      tecnico_mecanico: "bg-green-500/10 text-green-500 border-green-500/30",
      jefe_operaciones: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    }
    return colors[role] || "bg-muted text-muted-foreground border-border"
  }
}
