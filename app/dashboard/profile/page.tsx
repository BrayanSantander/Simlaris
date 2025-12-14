"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Save, Upload, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateProfile } from "firebase/auth"

export default function ProfilePage() {
  const { user, userRole } = useAuth()
  const [displayName, setDisplayName] = useState(userRole?.displayName || user?.displayName || "")
  const [photoURL, setPhotoURL] = useState(userRole?.photoURL || user?.photoURL || "")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log("[v0] ProfilePage - userRole changed:", userRole)
    if (userRole) {
      setDisplayName(userRole.displayName || "")
      setPhotoURL(userRole.photoURL || "")
    } else if (user) {
      setDisplayName(user.displayName || "")
      setPhotoURL(user.photoURL || "")
    }
  }, [userRole, user])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen debe ser menor a 2MB")
        return
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoURL(reader.result as string)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setError("No hay usuario autenticado")
      return
    }

    setLoading(true)
    setError("")
    setSaved(false)

    try {
      console.log("[v0] Updating user profile...")
      console.log("[v0] PhotoURL to save:", photoURL)

      if (displayName && displayName !== user.displayName) {
        console.log("[v0] Updating Firebase Auth displayName...")
        await updateProfile(user, {
          displayName: displayName,
        })
        console.log("[v0] Firebase Auth displayName updated successfully")
      }

      if (user.uid) {
        console.log("[v0] Updating Firestore document...")
        const userDocRef = doc(db, "users", user.uid)

        await updateDoc(userDocRef, {
          displayName: displayName || user.displayName || "",
          photoURL: photoURL || "",
          updatedAt: Date.now(),
        })
        console.log("[v0] Firestore document updated successfully")
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error("[v0] Error updating profile:", err)
      console.error("[v0] Error code:", err.code)
      console.error("[v0] Error message:", err.message)

      if (err.code === "permission-denied") {
        setError("No tienes permisos para actualizar el perfil. Contacta al administrador.")
      } else if (err.code === "not-found") {
        setError("Tu perfil de usuario no existe en la base de datos. Contacta al administrador.")
      } else {
        setError(`Error al guardar los cambios: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() || "U"
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-1">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      {saved && (
        <Alert className="bg-chart-3/10 border-chart-3">
          <AlertDescription className="text-chart-3">Perfil actualizado correctamente</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información de Perfil</CardTitle>
          <CardDescription>Actualiza tu nombre y foto de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Foto de Perfil</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {photoURL && <AvatarImage src={photoURL || "/placeholder.svg"} alt={displayName} />}
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  type="button"
                >
                  <Upload className="h-4 w-4" />
                  Subir imagen
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 2MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="displayName" className="text-base font-semibold">
              Nombre de Usuario
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Ingresa tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">Este nombre se mostrará en tu perfil y comentarios</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-semibold">
              Correo Electrónico
            </Label>
            <Input id="email" type="email" value={user?.email || ""} disabled className="max-w-md bg-muted" />
            <p className="text-sm text-muted-foreground">El correo no se puede modificar</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="role" className="text-base font-semibold">
              Rol
            </Label>
            <Input
              id="role"
              type="text"
              value={
                userRole?.role === "supervisor_mecanico"
                  ? "Supervisor Mecánico"
                  : userRole?.role === "tecnico_mecanico"
                    ? "Técnico Mecánico"
                    : userRole?.role === "jefe_operaciones"
                      ? "Jefe de Operaciones"
                      : "Cargando..."
              }
              disabled
              className="max-w-md bg-muted"
            />
            <p className="text-sm text-muted-foreground">Solo el Supervisor Mecánico puede modificar roles</p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
