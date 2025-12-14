"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { ChatService } from "@/lib/services/chat-service"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatMessage, UserRole } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PermissionsService } from "@/lib/services/permissions-service"

export default function ChatPage() {
  const { userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [availableUsers, setAvailableUsers] = useState<UserRole[]>([])
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  console.log("[v0] ChatPage rendered - userRole:", userRole?.role, "uid:", userRole?.uid)
  console.log("[v0] ChatPage - messages count:", messages.length)
  console.log("[v0] ChatPage - selectedUser:", selectedUser?.displayName)
  console.log("[v0] ChatPage - availableUsers:", availableUsers.length)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load available users to chat with
  useEffect(() => {
    if (authLoading) {
      console.log("[v0] ChatPage - Waiting for auth to complete...")
      return
    }

    if (!userRole) {
      console.log("[v0] ChatPage - No userRole yet, stopping load")
      setLoading(false)
      return
    }

    console.log("[v0] ChatPage - Loading users for role:", userRole.role)

    const loadUsers = async () => {
      try {
        const usersRef = collection(db, "users")

        console.log("[v0] ChatPage - Querying all users from Firestore...")
        const snapshot = await getDocs(usersRef)
        console.log("[v0] ChatPage - Found", snapshot.docs.length, "total users in Firestore")

        const allUsers = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("[v0] ChatPage - User doc:", doc.id, data)
          return {
            uid: doc.id,
            ...data,
          } as UserRole
        })

        let filteredUsers: UserRole[] = []

        if (userRole.role === "jefe_operaciones") {
          console.log("[v0] ChatPage - Filtering for supervisor_mecanico users...")
          // Jefe de operaciones solo puede chatear con supervisores mecánicos
          filteredUsers = allUsers.filter((u) => u.role === "supervisor_mecanico" && u.uid !== userRole.uid)
        } else if (userRole.role === "supervisor_mecanico") {
          console.log("[v0] ChatPage - Filtering for all chat-enabled users except tecnico_mecanico...")
          // Supervisor mecánico puede chatear con jefes de operaciones y otros supervisores
          filteredUsers = allUsers.filter(
            (u) => (u.role === "jefe_operaciones" || u.role === "supervisor_mecanico") && u.uid !== userRole.uid,
          )
        }
        // Los técnicos mecánicos no tienen acceso al chat (verificado por PermissionsService.canAccessChat)

        console.log("[v0] ChatPage - After filtering:", filteredUsers.length, "users")
        setAvailableUsers(filteredUsers)

        console.log("[v0] ChatPage - Users loaded, waiting for user selection")
      } catch (error) {
        console.error("[v0] ChatPage - Error loading users:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios disponibles",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [userRole, authLoading, toast])

  // Subscribe to messages
  useEffect(() => {
    if (!userRole || !selectedUser) {
      console.log(
        "[v0] ChatPage - No se puede suscribir a mensajes - userRole:",
        userRole,
        "selectedUser:",
        selectedUser,
      )
      return
    }

    console.log("[v0] ChatPage - Suscribiendo a mensajes...")
    const unsubscribe = ChatService.subscribeToMessages(userRole.uid, selectedUser.uid, (newMessages) => {
      console.log("[v0] ChatPage - Mensajes recibidos:", newMessages.length)
      setMessages(newMessages)

      // Mark messages as read
      newMessages.forEach((msg) => {
        if (msg.receiverId === userRole.uid && !msg.read) {
          ChatService.markAsRead(msg.id)
        }
      })
    })

    return () => {
      console.log("[v0] ChatPage - Desuscribiendo de mensajes")
      unsubscribe()
    }
  }, [userRole, selectedUser])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userRole || !selectedUser || sending) return

    console.log("[v0] ChatPage - Enviando mensaje...")
    try {
      setSending(true)
      await ChatService.sendMessage({
        senderId: userRole.uid,
        senderName: userRole.displayName,
        senderRole: userRole.role,
        receiverId: selectedUser.uid,
        receiverName: selectedUser.displayName,
        message: newMessage,
        read: false,
        type: "text",
      })

      setNewMessage("")
      console.log("[v0] ChatPage - Mensaje enviado exitosamente")

      setTimeout(scrollToBottom, 100)

      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado",
      })
    } catch (error) {
      console.error("[v0] ChatPage - Error sending message:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!userRole) return

    try {
      await ChatService.deleteMessage(messageId, userRole.uid)
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje ha sido eliminado",
      })
    } catch (error) {
      console.error("[v0] ChatPage - Error deleting message:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  if (!PermissionsService.canAccessChat(userRole.role)) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Acceso Restringido</h2>
          <p className="text-muted-foreground">No tienes permisos para acceder al sistema de mensajería.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (availableUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-3">
          <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Selecciona un usuario para comenzar a chatear</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Lista de Usuarios - Sidebar */}
        <Card className="lg:col-span-4 xl:col-span-3 flex flex-col overflow-hidden">
          <div className="border-b px-4 py-3 bg-muted/30">
            <h2 className="font-semibold text-sm">Mensajes</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {availableUsers.map((user) => (
              <button
                key={user.uid}
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b ${
                  selectedUser?.uid === user.uid ? "bg-muted" : ""
                }`}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {user.photoURL && <AvatarImage src={user.photoURL || "/placeholder.svg"} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm truncate">{user.displayName}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {PermissionsService.getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-8 xl:col-span-9 flex flex-col">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">Selecciona un usuario para comenzar a chatear</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header del Chat */}
              <div className="border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    {selectedUser.photoURL && <AvatarImage src={selectedUser.photoURL || "/placeholder.svg"} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {selectedUser.displayName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base sm:text-lg truncate">{selectedUser.displayName}</h2>
                    <Badge variant="outline" className="text-[10px] sm:text-xs mt-0.5">
                      {PermissionsService.getRoleDisplayName(selectedUser.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-muted/5">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/30 mb-3 sm:mb-4" />
                    <p className="text-muted-foreground text-base sm:text-lg font-medium">No hay mensajes aún</p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Comienza la conversación</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isOwn = message.senderId === userRole.uid
                      const isDeleted = (message as any).deleted

                      return (
                        <div key={message.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                          {!isOwn && (
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 mt-1">
                              {selectedUser.photoURL && (
                                <AvatarImage src={selectedUser.photoURL || "/placeholder.svg"} />
                              )}
                              <AvatarFallback className="bg-muted text-[10px]">
                                {selectedUser.displayName?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[70%]`}>
                            <div
                              className={`rounded-2xl px-3 py-2 sm:px-4 ${
                                isDeleted
                                  ? "bg-muted/50 border border-dashed"
                                  : isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border shadow-sm"
                              }`}
                            >
                              <p
                                className={`text-xs sm:text-sm break-words ${isDeleted ? "italic text-muted-foreground" : ""}`}
                              >
                                {isDeleted ? "Este mensaje fue eliminado" : message.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p
                                  className={`text-[9px] sm:text-[10px] ${
                                    isDeleted
                                      ? "text-muted-foreground/50"
                                      : isOwn
                                        ? "text-primary-foreground/60"
                                        : "text-muted-foreground/70"
                                  }`}
                                >
                                  {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {isOwn && !isDeleted && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-primary-foreground/60 hover:text-primary-foreground" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de Mensaje */}
              <div className="border-t px-4 sm:px-6 py-3 sm:py-4 bg-background">
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 text-sm"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
