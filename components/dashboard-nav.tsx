"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { AuthService } from "@/lib/services/auth-service"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Factory, LayoutDashboard, Settings, User, LogOut, Bell, Activity, Users, MessageSquare } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PermissionsService } from "@/lib/services/permissions-service"

export function DashboardNav() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log(
    "[v0] DashboardNav - user:",
    user?.email,
    "userRole:",
    userRole?.role,
    "photoURL:",
    userRole?.photoURL,
    "loading:",
    loading,
  )

  const handleSignOut = async () => {
    await AuthService.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/dashboard", label: "Panel General", icon: LayoutDashboard },
    { href: "/dashboard/machines", label: "Máquinas", icon: Factory },
    { href: "/dashboard/alerts", label: "Alertas", icon: Bell },
    { href: "/dashboard/predictive", label: "Predictivo", icon: Activity },
    { href: "/dashboard/chat", label: "Mensajería", icon: MessageSquare },
    { href: "/dashboard/config", label: "Configuración", icon: Settings },
    { href: "/dashboard/users", label: "Usuarios", icon: Users },
  ]

  const displayName = userRole?.displayName || user?.displayName || user?.email?.split("@")[0] || "Usuario"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SIMLARIS
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Sistema IoT Industrial</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2", isActive && "bg-secondary")}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userRole?.photoURL || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  {userRole && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs mt-0.5", PermissionsService.getRoleBadgeColor(userRole.role))}
                    >
                      {PermissionsService.getRoleDisplayName(userRole.role)}
                    </Badge>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/config">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Usuarios</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="lg:hidden border-t border-border/40">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2 whitespace-nowrap", isActive && "bg-secondary")}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
