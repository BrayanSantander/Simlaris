// Servicio de mensajería para coordinación de compra de repuestos

import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatMessage } from "@/lib/types"

export class ChatService {
  private static MESSAGES_COLLECTION = "chat_messages"

  /**
   * Envía un mensaje
   */
  static async sendMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<string> {
    console.log("[v0] Enviando mensaje:", message)
    try {
      const messagesRef = collection(db, this.MESSAGES_COLLECTION)
      const docRef = await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
        read: false,
        deleted: false,
      })
      console.log("[v0] Mensaje enviado con ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("[v0] Error al enviar mensaje:", error)
      throw error
    }
  }

  /**
   * Suscribe a mensajes entre dos usuarios en tiempo real
   */
  static subscribeToMessages(
    userId: string,
    otherUserId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void {
    console.log("[v0] Suscribiendo a mensajes entre:", userId, "y", otherUserId)
    const messagesRef = collection(db, this.MESSAGES_COLLECTION)

    const q = query(messagesRef, orderBy("createdAt", "asc"))

    return onSnapshot(
      q,
      (snapshot) => {
        console.log("[v0] Snapshot recibido con", snapshot.docs.length, "mensajes totales")
        const allMessages = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toMillis?.() || data.createdAt || Date.now(),
          }
        }) as ChatMessage[]

        // Filtrar mensajes entre los dos usuarios
        const filteredMessages = allMessages.filter(
          (msg) =>
            (msg.senderId === userId && msg.receiverId === otherUserId) ||
            (msg.senderId === otherUserId && msg.receiverId === userId),
        )

        filteredMessages.sort((a, b) => a.timestamp - b.timestamp)

        console.log("[v0] Mensajes filtrados y ordenados:", filteredMessages.length)
        callback(filteredMessages)
      },
      (error) => {
        console.error("[v0] Error en snapshot de mensajes:", error)
        callback([])
      },
    )
  }

  /**
   * Marca un mensaje como leído
   */
  static async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId)
      await updateDoc(messageRef, { read: true })
    } catch (error) {
      console.error("[v0] Error marcando mensaje como leído:", error)
    }
  }

  /**
   * Elimina un mensaje (soft delete)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    console.log("[v0] Eliminando mensaje:", messageId)
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId)
      await updateDoc(messageRef, {
        deleted: true,
        deletedBy: userId,
        deletedAt: Date.now(),
      })
      console.log("[v0] Mensaje eliminado exitosamente")
    } catch (error) {
      console.error("[v0] Error eliminando mensaje:", error)
      throw new Error("No se pudo eliminar el mensaje")
    }
  }

  /**
   * Actualiza el estado de "escribiendo"
   */
  static async setTypingStatus(userId: string, otherUserId: string, isTyping: boolean): Promise<void> {
    // Implementación simplificada sin colección adicional
    // Esto se puede implementar más adelante si es necesario
  }

  /**
   * Suscribe al estado de "escribiendo"
   */
  static subscribeToTypingStatus(
    userId: string,
    otherUserId: string,
    callback: (isTyping: boolean) => void,
  ): () => void {
    // Retornar función vacía por ahora
    return () => {}
  }
}
