import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  addDoc,
} from "firebase/firestore"
import type { Machine, SensorData, Alert, Threshold, PredictionResult } from "@/lib/types"
import { SensorProcessingService } from "./sensor-processing"

export class FirestoreService {
  // Colecciones
  private static MACHINES = "machines"
  private static SENSOR_DATA = "sensor_data"
  private static ALERTS = "alerts"
  private static THRESHOLDS = "thresholds"
  private static PREDICTIONS = "predictions"

  /**
   * Obtiene todas las máquinas
   */
  static async getMachines(): Promise<Machine[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.MACHINES))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Machine[]
    } catch (error) {
      console.error("[v0] Error al obtener máquinas:", error)
      return []
    }
  }

  /**
   * Obtiene una máquina por ID
   */
  static async getMachineById(id: string): Promise<Machine | null> {
    try {
      const docRef = doc(db, this.MACHINES, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Machine
      }
      return null
    } catch (error) {
      console.error("[v0] Error al obtener máquina:", error)
      return null
    }
  }

  /**
   * Suscripción en tiempo real a cambios en máquinas
   */
  static subscribeMachines(callback: (machines: Machine[]) => void): () => void {
    const unsubscribe = onSnapshot(
      collection(db, this.MACHINES),
      (snapshot) => {
        const machines = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Machine[]
        callback(machines)
      },
      (error) => {
        console.error("[v0] Error en suscripción de máquinas:", error)
      },
    )
    return unsubscribe
  }

  /**
   * Obtiene datos de sensores históricos para una máquina
   * Si la máquina tiene una colección asociada, obtiene TODOS los datos de esa colección
   * Si no, busca datos filtrados por machineId en la colección por defecto
   */
  static async getSensorData(machineId: string, hours = 24): Promise<SensorData[]> {
    try {
      const machine = await this.getMachineById(machineId)
      const collectionName = machine?.sensorCollectionName || this.SENSOR_DATA
      const startTime = Date.now() - hours * 60 * 60 * 1000

      console.log(`[v0] Obteniendo datos desde: ${collectionName}`)

      // Obtener TODA la colección sin filtros
      const snapshot = await getDocs(collection(db, collectionName))

      console.log(`[v0] Total documentos en colección: ${snapshot.size}`)

      // porque toda la colección pertenece a esta máquina
      let filtered: SensorData[]

      if (machine?.sensorCollectionName) {
        // Colección dedicada a esta máquina - tomar todos los datos
        filtered = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              ...data,
              // Asegurar que timestamp existe
              timestamp: data.timestamp || Date.now(),
            } as SensorData
          })
          .filter((item) => item.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp)

        console.log(`[v0] Colección dedicada - todos los documentos del período: ${filtered.length}`)
      } else {
        // Colección compartida - filtrar por machineId
        filtered = snapshot.docs
          .map((doc) => doc.data() as SensorData)
          .filter((item) => item.machineId === machineId && item.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp)

        console.log(`[v0] Documentos filtrados para máquina ${machineId}: ${filtered.length}`)
      }

      return filtered
    } catch (error) {
      console.error("[v0] Error al obtener datos de sensores:", error)
      return []
    }
  }

  /**
   * Guarda datos de sensores (llamado desde ESP32)
   */
  static async saveSensorData(machineId: string, data: SensorData): Promise<void> {
    try {
      await addDoc(collection(db, this.SENSOR_DATA), {
        machineId,
        ...data,
        timestamp: Timestamp.now().toMillis(),
      })
    } catch (error) {
      console.error("[v0] Error al guardar datos de sensores:", error)
    }
  }

  /**
   * Obtiene alertas activas
   */
  static async getAlerts(onlyUnacknowledged = false): Promise<Alert[]> {
    try {
      let q = query(collection(db, this.ALERTS), orderBy("timestamp", "desc"), limit(50))

      if (onlyUnacknowledged) {
        q = query(q, where("acknowledged", "==", false))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Alert[]
    } catch (error) {
      console.error("[v0] Error al obtener alertas:", error)
      return []
    }
  }

  /**
   * Crea una nueva alerta
   */
  static async createAlert(alert: Omit<Alert, "id">): Promise<void> {
    try {
      await addDoc(collection(db, this.ALERTS), {
        ...alert,
        timestamp: Timestamp.now().toMillis(),
      })
    } catch (error) {
      console.error("[v0] Error al crear alerta:", error)
    }
  }

  /**
   * Actualiza estado de alerta (reconocer)
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const alertRef = doc(db, this.ALERTS, alertId)
      await updateDoc(alertRef, { acknowledged: true })
    } catch (error) {
      console.error("[v0] Error al actualizar alerta:", error)
    }
  }

  /**
   * Obtiene umbrales configurados
   */
  static async getThresholds(): Promise<Threshold[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.THRESHOLDS))
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Threshold[]
    } catch (error) {
      console.error("[v0] Error al obtener umbrales:", error)
      return []
    }
  }

  /**
   * Guarda o actualiza umbrales
   */
  static async saveThreshold(machineId: string, threshold: Threshold): Promise<void> {
    try {
      const thresholdRef = doc(db, this.THRESHOLDS, machineId)
      await setDoc(thresholdRef, threshold, { merge: true })
    } catch (error) {
      console.error("[v0] Error al guardar umbrales:", error)
    }
  }

  /**
   * Obtiene predicciones de mantenimiento
   */
  static async getPredictions(): Promise<PredictionResult[]> {
    try {
      const q = query(collection(db, this.PREDICTIONS), orderBy("timestamp", "desc"), limit(20))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => doc.data()) as PredictionResult[]
    } catch (error) {
      console.error("[v0] Error al obtener predicciones:", error)
      return []
    }
  }

  /**
   * Guarda resultado de predicción ML
   */
  static async savePrediction(prediction: PredictionResult): Promise<void> {
    try {
      await addDoc(collection(db, this.PREDICTIONS), {
        ...prediction,
        timestamp: Timestamp.now().toMillis(),
      })
    } catch (error) {
      console.error("[v0] Error al guardar predicción:", error)
    }
  }

  /**
   * Crea una nueva máquina
   */
  static async createMachine(machine: Omit<Machine, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.MACHINES), {
        ...machine,
        createdAt: Timestamp.now().toMillis(),
        lastUpdate: Timestamp.now().toMillis(),
      })
      console.log("[v0] Máquina creada con ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("[v0] Error al crear máquina:", error)
      throw error
    }
  }

  /**
   * Actualiza datos de una máquina (llamado por ESP32)
   */
  static async updateMachineData(machineId: string, sensorData: SensorData, status: Machine["status"]): Promise<void> {
    try {
      const machineRef = doc(db, this.MACHINES, machineId)
      const machineDoc = await getDoc(machineRef)

      if (!machineDoc.exists()) {
        console.error("[v0] Máquina no encontrada:", machineId)
        return
      }

      const machine = machineDoc.data() as Machine
      const now = Date.now()
      const hoursSinceLastUpdate = (now - machine.lastUpdate) / (1000 * 60 * 60)

      let totalOperationalHours = machine.totalOperationalHours || 0
      let totalDowntimeHours = machine.totalDowntimeHours || 0

      if (status === "operational") {
        totalOperationalHours += hoursSinceLastUpdate
      } else if (status === "offline") {
        totalDowntimeHours += hoursSinceLastUpdate
      }

      const totalHours = totalOperationalHours + totalDowntimeHours
      const efficiency = totalHours > 0 ? Math.round((totalOperationalHours / totalHours) * 100) : 0

      await updateDoc(machineRef, {
        currentData: sensorData,
        status,
        lastUpdate: now,
        efficiency,
        totalOperationalHours,
        totalDowntimeHours,
      })

      console.log("[v0] Máquina actualizada:", machineId, "Estado:", status, "Eficiencia:", efficiency)
    } catch (error) {
      console.error("[v0] Error al actualizar máquina:", error)
    }
  }

  /**
   * Suscripción en tiempo real al último dato de sensor de una máquina
   * Retorna solo el registro más reciente y se actualiza automáticamente
   */
  static async subscribeToLatestSensorData(
    machineId: string,
    callback: (data: SensorData | null) => void,
  ): Promise<() => void> {
    console.log(`[v0] Iniciando suscripción a datos en tiempo real para máquina: ${machineId}`)

    const machine = await this.getMachineById(machineId)
    const collectionName = machine?.sensorCollectionName || this.SENSOR_DATA

    console.log(`[v0] Colección detectada: ${collectionName}`)
    console.log(`[v0] Máquina tiene sensorCollectionName: ${machine?.sensorCollectionName ? "SÍ" : "NO"}`)

    // Suscripción a TODA la colección sin orderBy para evitar índices
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        console.log(`[v0] ✓ Snapshot recibido con ${snapshot.size} documentos`)

        if (!snapshot.empty) {
          // Obtener todos los documentos y mapear al formato del sistema
          const allDocs = snapshot.docs.map((doc) => {
            const rawData = doc.data()
            console.log(`[v0] Documento raw: ${doc.id}`, rawData)

            // Mapear al formato del sistema
            const mappedData = this.mapFirestoreToSensorData(rawData)
            console.log(`[v0] Documento mapeado:`, mappedData)

            return mappedData
          })

          // Ordenar por timestamp descendente y tomar el más reciente
          const sorted = allDocs.sort((a, b) => {
            const timestampA = a.timestamp || 0
            const timestampB = b.timestamp || 0
            return timestampB - timestampA
          })

          const latestData = sorted[0]
          console.log(`[v0] ✓ Último dato seleccionado:`, {
            timestamp: new Date(latestData.timestamp).toLocaleString(),
            pressure: latestData.pressure,
            temperature: latestData.temperature,
            humidity: latestData.humidity,
            vibrationRMS: latestData.vibrationRMS.toFixed(2),
          })

          callback(latestData)
        } else {
          console.log(`[v0] ⚠ No hay datos disponibles en la colección ${collectionName}`)
          callback(null)
        }
      },
      (error) => {
        console.error("[v0] ✗ Error en suscripción de sensores:", error)
        callback(null)
      },
    )

    console.log(`[v0] Suscripción establecida exitosamente`)
    return unsubscribe
  }

  /**
   * Mapea los datos del formato de Firestore al formato del sistema
   * Convierte campos como 'fecha' a 'timestamp', 'ax' a 'vibrationX', etc.
   */
  private static mapFirestoreToSensorData(data: any): SensorData {
    // Convertir fecha (Timestamp de Firestore) a número
    let timestamp = Date.now()
    if (data.fecha) {
      if (typeof data.fecha === "object" && data.fecha.toMillis) {
        // Es un Timestamp de Firestore
        timestamp = data.fecha.toMillis()
      } else if (typeof data.fecha === "number") {
        timestamp = data.fecha
      }
    } else if (data.timestamp) {
      timestamp = data.timestamp
    }

    // Valores crudos del sensor
    const ax = data.ax || 0
    const ay = data.ay || 0
    const az = data.az || 0
    const gx = data.gx || 0
    const gy = data.gy || 0
    const gz = data.gz || 0

    // Procesar datos crudos usando las fórmulas correctas
    const processed = SensorProcessingService.processRawSensorData({ ax, ay, az, gx, gy, gz })

    // Calcular métricas de ventana
    const { rms, peak, crestFactor } = SensorProcessingService.addToWindow(processed.a_vibration_g)

    return {
      timestamp,
      vibrationX: processed.accel_g.x,
      vibrationY: processed.accel_g.y,
      vibrationZ: processed.accel_g.z,
      vibrationRMS: rms, // RMS calculado correctamente
      gyroscopeX: processed.gyro_dps.x,
      gyroscopeY: processed.gyro_dps.y,
      gyroscopeZ: processed.gyro_dps.z,
      pressure: data.presion_bar || 0,
      temperature: data.temperatura || 0,
      humidity: data.humedad || 0,
    }
  }
}
