// Tipos TypeScript para el sistema SIMLARIS

export interface SensorData {
  timestamp: number
  vibrationX: number
  vibrationY: number
  vibrationZ: number
  vibrationRMS: number
  gyroscopeX: number
  gyroscopeY: number
  gyroscopeZ: number
  pressure: number
  temperature: number
  humidity: number
}

export interface Machine {
  id: string
  name: string
  type: string
  location: string
  brand: string
  model: string
  year: number
  status: "operational" | "warning" | "critical" | "offline"
  lastUpdate: number
  currentData: SensorData
  efficiency: number
  riskScore: number
  thresholds: MachineThresholds
  totalOperationalHours: number
  totalDowntimeHours: number
  sensorCollectionName?: string // Nombre de la colección en Firestore donde están los datos de sensores
}

export interface Alert {
  id: string
  machineId: string
  machineName: string
  type: "vibration" | "pressure" | "temperature" | "humidity" | "prediction"
  severity: "info" | "warning" | "critical"
  message: string
  timestamp: number
  acknowledged: boolean
}

export interface Threshold {
  machineId: string
  vibrationRMSMax: number
  pressureMax: number
  temperatureMax: number
  humidityMax: number
  criticalFrequencies: number[]
}

export interface PredictionResult {
  machineId: string
  failureProbability: number
  affectedComponent: string
  estimatedDaysToMaintenance: number
  confidence: number
  timestamp: number
}

export type UserRoleType = "supervisor_mecanico" | "tecnico_mecanico" | "jefe_operaciones"

export interface UserRole {
  uid: string
  email: string
  role: UserRoleType
  displayName: string
}

export interface MachineThresholds {
  maxPressurePSI: number
  maxTemperature: number
  maxHumidity: number
  maxAcceleration: number
  maxGyroscope: number
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRoleType
  receiverId: string
  receiverName: string
  message: string
  timestamp: number
  read: boolean
  type: "text" | "spare_part_request"
  sparePart?: {
    machineId: string
    machineName: string
    partName: string
    quantity: number
    urgency: "low" | "medium" | "high"
  }
  deleted?: boolean
  deletedBy?: string
  deletedAt?: number
}

export interface Conversation {
  id: string
  participants: {
    uid: string
    name: string
    role: UserRoleType
  }[]
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
}

export interface BigQueryPrediction {
  timestamp: string
  sensors: {
    temperatura: number
    vibracion: number
    presion: number
    humedad: number
  }
  prediction: {
    mse: number
    severity: "NORMAL" | "ADVERTENCIA" | "CRITICO"
    is_anomaly: boolean
    anomaly_probability: number
  }
}
