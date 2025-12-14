"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/services/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Factory, Loader2, User, Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      await AuthService.signUp(email, password, displayName)
      router.push("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está registrado.")
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.")
      } else {
        setError("Error al crear la cuenta. Por favor, intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0A1628] via-[#1e3a5f] to-[#0A1628] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/abstract-industrial-network-pattern.jpg')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-[#00A8E8] flex items-center justify-center">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SIMLARIS</h1>
              <p className="text-sm text-blue-200">Sistema IoT Industrial</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-balance">
            Únete a la plataforma de monitoreo industrial más avanzada
          </h2>
          <p className="text-lg text-blue-100 leading-relaxed text-pretty">
            Crea tu cuenta y comienza a gestionar tu flota de maquinaria con tecnología IoT de última generación.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-3xl font-bold text-[#00A8E8]">99.9%</p>
              <p className="text-sm text-blue-200 mt-1">Tiempo operativo</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-3xl font-bold text-[#00A8E8]">Real-Time</p>
              <p className="text-sm text-blue-200 mt-1">Monitoreo IoT</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-sm text-blue-200">
          <span>Tecnología de vanguardia</span>
          <span>•</span>
          <span>Seguridad empresarial</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Factory className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">SIMLARIS</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Crear cuenta</h2>
            <p className="text-muted-foreground">Ingresa tus datos para comenzar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
