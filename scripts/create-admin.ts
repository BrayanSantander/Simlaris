/**
 * Script para crear el primer usuario administrador en SIMLARIS
 *
 * Uso:
 * 1. Ejecutar este script desde Node.js
 * 2. O seguir las instrucciones en ADMIN_SETUP.md para hacerlo manualmente
 */

import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createAdminUser() {
  try {
    // Datos del administrador (CAMBIAR ESTOS VALORES)
    const adminEmail = "admin@simlaris.com"
    const adminPassword = "Admin123456" // Cambiar por una contraseña segura
    const adminName = "Administrador SIMLARIS"

    console.log("Creando usuario administrador...")

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const user = userCredential.user

    console.log(`Usuario creado: ${user.uid}`)

    // Crear documento en Firestore con rol admin
    await setDoc(doc(db, "users", user.uid), {
      email: adminEmail,
      displayName: adminName,
      role: "admin",
      createdAt: Date.now(),
    })

    console.log("✅ Usuario administrador creado exitosamente")
    console.log(`Email: ${adminEmail}`)
    console.log(`Rol: admin`)
    console.log("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión")

    process.exit(0)
  } catch (error: any) {
    console.error("❌ Error al crear usuario administrador:", error.message)
    process.exit(1)
  }
}

createAdminUser()
