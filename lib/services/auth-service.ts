// Servicio de autenticación y gestión de roles

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserRole, UserRoleType } from "@/lib/types"
import { PermissionsService } from "./permissions-service"

export class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  static async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  /**
   * Verifica si existen usuarios en el sistema
   */
  static async hasExistingUsers(): Promise<boolean> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, limit(1))
      const snapshot = await getDocs(q)
      return !snapshot.empty
    } catch (error) {
      console.error("[v0] Error checking existing users:", error)
      return false
    }
  }

  /**
   * Registra un nuevo usuario
   */
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    const hasUsers = await this.hasExistingUsers()
    const role: UserRoleType = hasUsers ? "tecnico_mecanico" : "supervisor_mecanico"

    console.log("[v0] Creating user with role:", role, "Has existing users:", hasUsers)

    // Crear documento de usuario en Firestore con rol apropiado
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      displayName,
      role, // Primer usuario: supervisor_mecanico, siguientes: tecnico_mecanico
      createdAt: Date.now(),
    })

    return userCredential.user
  }

  /**
   * Cierra sesión
   */
  static async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  }

  /**
   * Obtiene el rol del usuario desde Firestore
   */
  static async getUserRole(uid: string): Promise<UserRole | null> {
    console.log("[v0] AuthService.getUserRole called with UID:", uid)

    try {
      const userDoc = await getDoc(doc(db, "users", uid))
      console.log("[v0] User document exists:", userDoc.exists())

      if (!userDoc.exists()) {
        console.log("[v0] No user document found for UID:", uid)
        return null
      }

      const data = userDoc.data()
      console.log("[v0] User document data:", data)

      const userRole = {
        uid,
        email: data.email,
        role: data.role,
        displayName: data.displayName,
      }

      console.log("[v0] Returning user role:", userRole)
      return userRole
    } catch (error) {
      console.error("[v0] Error fetching user role:", error)
      return null
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  static async hasRole(uid: string, role: UserRoleType): Promise<boolean> {
    const userRole = await this.getUserRole(uid)
    return userRole?.role === role
  }

  /**
   * Verifica si el usuario tiene al menos un nivel de acceso
   */
  static async hasMinimumRole(uid: string, minRole: UserRoleType): Promise<boolean> {
    const userRole = await this.getUserRole(uid)
    if (!userRole) return false

    return PermissionsService.hasMinimumLevel(userRole.role, minRole)
  }

  /**
   * Verifica si el usuario puede acceder a un módulo
   */
  static async canAccessModule(uid: string, moduleName: string): Promise<boolean> {
    const userRole = await this.getUserRole(uid)
    if (!userRole) return false

    return PermissionsService.canAccessModule(userRole.role, moduleName)
  }

  /**
   * Observa cambios en el estado de autenticación
   */
  static onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }
}
