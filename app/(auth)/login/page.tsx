"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthService } from "@/lib/services/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Factory, Loader2, Shield, Activity, BarChart3 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await AuthService.signIn(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError("Credenciales inválidas. Por favor, verifica tu email y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A1628] via-[#1e3a5f] to-[#0A1628] p-12 flex-col justify-between relative overflow-hidden">
        {/* Patrón de fondo técnico */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Logo y título */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-[#00A8E8]/20 border border-[#00A8E8]/30 flex items-center justify-center backdrop-blur-sm">
              <Factory className="h-7 w-7 text-[#00A8E8]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">SIMLARIS</h1>
              <p className="text-[#4FC3F7] text-sm font-medium">Industrial IoT Platform</p>
            </div>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed max-w-md">
            Sistema avanzado de monitoreo y localización de anomalías con redes IoT y modelos predictivos
          </p>
        </div>

        {/* Características */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#00A8E8]/10 border border-[#00A8E8]/20 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-[#00A8E8]" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Monitoreo en Tiempo Real</h3>
              <p className="text-gray-400 text-sm">
                Datos de sensores IoT actualizados cada segundo desde maquinaria industrial
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#00A8E8]/10 border border-[#00A8E8]/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-[#00A8E8]" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Análisis Predictivo</h3>
              <p className="text-gray-400 text-sm">
                Modelos de Machine Learning para anticipar fallas y optimizar mantenimiento
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#00A8E8]/10 border border-[#00A8E8]/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-[#00A8E8]" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Gestión Segura</h3>
              <p className="text-gray-400 text-sm">Control de acceso basado en roles y autenticación empresarial</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-gray-400 text-sm">
          <p>© 2025 SIMLARIS. Desarrollado para Holesteck S.A.</p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Factory className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SIMLARIS</h1>
                <p className="text-sm text-muted-foreground">Industrial IoT</p>
              </div>
            </div>
          </div>

          {/* Encabezado */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
            <p className="text-muted-foreground mt-2">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-background"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando credenciales...
                </>
              ) : (
                "Acceder al Sistema"
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-border space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Crear cuenta nueva
                </Link>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿Problemas para acceder?{" "}
                <button className="text-primary hover:underline font-medium">Contactar soporte técnico</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
