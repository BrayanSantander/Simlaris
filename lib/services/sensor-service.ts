import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, writeBatch, limit, doc, getDoc } from "firebase/firestore"

export class SensorService {
  /**
   * Obtiene todas las colecciones de sensores disponibles en Firestore
   * y detecta cuáles no están asociadas a ninguna máquina
   */
  static async getUnassignedSensors() {
    try {
      console.log("[v0] Buscando datos de sensores sin asignar...")

      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000

      const q = query(collection(db, "sensor_data"), orderBy("timestamp", "desc"), limit(100))

      const snapshot = await getDocs(q)
      console.log("[v0] Documentos encontrados en sensor_data:", snapshot.size)

      // Agrupar datos por identificadores únicos
      const sensorMap = new Map<string, any>()

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        const docId = docSnapshot.id

        console.log("[v0] Procesando documento:", docId, "machineId:", data.machineId)

        // Identificador del sensor (puede ser sensorId, deviceId, o el ID del documento)
        const sensorId = data.sensorId || data.deviceId || docId

        // Solo incluir si no tiene machineId o es "unassigned"
        if (!data.machineId || data.machineId === "unassigned") {
          if (!sensorMap.has(sensorId)) {
            sensorMap.set(sensorId, {
              id: sensorId,
              lastData: data,
              lastTimestamp: data.timestamp || Date.now(),
              dataCount: 1,
              docId: docId,
            })
          } else {
            const existing = sensorMap.get(sensorId)!
            existing.dataCount++
            const dataTimestamp = data.timestamp || Date.now()
            if (dataTimestamp > existing.lastTimestamp) {
              existing.lastData = data
              existing.lastTimestamp = dataTimestamp
              existing.docId = docId
            }
          }
        }
      })

      const result = Array.from(sensorMap.values())
      console.log("[v0] Sensores sin asignar encontrados:", result.length)
      return result
    } catch (error) {
      console.error("[v0] Error obteniendo sensores sin asignar:", error)
      return []
    }
  }

  /**
   * Asocia todos los datos de un sensor (o ID de documento) a una máquina
   * Actualiza todos los registros históricos agregando el campo machineId
   */
  static async associateSensorToMachine(sensorId: string, machineId: string) {
    try {
      console.log("[v0] Asociando sensor/documento", sensorId, "a máquina", machineId)

      let docsToUpdate: any[] = []

      // Intentar buscar por sensorId
      const q1 = query(collection(db, "sensor_data"), where("sensorId", "==", sensorId))
      const snapshot1 = await getDocs(q1)
      if (!snapshot1.empty) {
        docsToUpdate = snapshot1.docs
        console.log("[v0] Encontrados por sensorId:", docsToUpdate.length)
      }

      // Si no hay resultados, intentar por deviceId
      if (docsToUpdate.length === 0) {
        const q2 = query(collection(db, "sensor_data"), where("deviceId", "==", sensorId))
        const snapshot2 = await getDocs(q2)
        if (!snapshot2.empty) {
          docsToUpdate = snapshot2.docs
          console.log("[v0] Encontrados por deviceId:", docsToUpdate.length)
        }
      }

      // Si tampoco hay resultados, intentar obtener el documento directamente por ID
      if (docsToUpdate.length === 0) {
        const docRef = doc(db, "sensor_data", sensorId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          docsToUpdate = [docSnap]
          console.log("[v0] Encontrado documento directo por ID")
        }
      }

      // Si aún no hay resultados, obtener TODOS los datos sin machineId y asociarlos
      if (docsToUpdate.length === 0) {
        console.log("[v0] No se encontró por ID específico, buscando todos los datos sin asignar...")
        const q3 = query(collection(db, "sensor_data"), where("machineId", "==", null))
        const snapshot3 = await getDocs(q3)

        if (!snapshot3.empty) {
          docsToUpdate = snapshot3.docs
          console.log("[v0] Encontrados datos sin machineId:", docsToUpdate.length)
        }
      }

      if (docsToUpdate.length === 0) {
        throw new Error(
          "No se encontraron datos para asociar. Verifica que los sensores estén enviando datos a Firestore.",
        )
      }

      // Actualizar en lotes (Firestore permite 500 operaciones por lote)
      const batchSize = 500
      for (let i = 0; i < docsToUpdate.length; i += batchSize) {
        const batch = writeBatch(db)
        const batchDocs = docsToUpdate.slice(i, i + batchSize)

        batchDocs.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            machineId,
            // Preservar o agregar sensorId si no existe
            sensorId: docSnapshot.data().sensorId || sensorId,
          })
        })

        await batch.commit()
        console.log(`[v0] Lote ${i / batchSize + 1} completado:`, batchDocs.length, "documentos")
      }

      console.log("[v0] Asociación completada exitosamente:", docsToUpdate.length, "documentos actualizados")
      return docsToUpdate.length
    } catch (error) {
      console.error("[v0] Error asociando sensor:", error)
      throw error
    }
  }

  /**
   * Desasocia un sensor de una máquina
   */
  static async dissociateSensor(sensorId: string) {
    try {
      const q = query(collection(db, "sensor_data"), where("sensorId", "==", sensorId))
      const snapshot = await getDocs(q)

      const batch = writeBatch(db)
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { machineId: null })
      })
      await batch.commit()

      console.log("[v0] Sensor desasociado:", snapshot.size, "documentos actualizados")
    } catch (error) {
      console.error("[v0] Error desasociando sensor:", error)
      throw error
    }
  }
}
