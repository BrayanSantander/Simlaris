"use client"

import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { AuthService } from "@/lib/services/auth-service"
import type { UserRole } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] useAuth hook initialized")

    const unsubscribe = AuthService.onAuthChange(async (firebaseUser) => {
      console.log("[v0] Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user")
      setUser(firebaseUser)

      if (firebaseUser) {
        console.log("[v0] Fetching user role for UID:", firebaseUser.uid)
        const role = await AuthService.getUserRole(firebaseUser.uid)
        console.log("[v0] User role fetched:", role)
        setUserRole(role)
      } else {
        console.log("[v0] No user, clearing userRole")
        setUserRole(null)
      }

      setLoading(false)
      console.log("[v0] Auth loading complete")
    })

    return () => {
      console.log("[v0] useAuth cleanup")
      unsubscribe()
    }
  }, [])

  const userData = userRole

  console.log("[v0] useAuth returning - user:", user?.email, "userRole:", userRole?.role, "loading:", loading)

  return { user, userRole, userData, loading }
}
