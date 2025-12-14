// Servicio para gestión de alertas

import type { Alert, SensorData, Threshold } from "@/lib/types"
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export class AlertService {
  /**
   * Evalúa datos de sensores y genera alertas si superan umbrales
   */
  static async evaluateAndCreateAlerts(
    machineId: string,
    machineName: string,
    data: SensorData,
    thresholds: Threshold,
  ): Promise<Alert[]> {
    const alerts: Alert[] = []

    // Verificar vibración
    if (data.vibrationRMS > thresholds.vibrationRMSMax * 0.8) {
      alerts.push({
        id: `alert-${Date.now()}-vibration`,
        machineId,
        machineName,
        type: "vibration",
        severity: data.vibrationRMS > thresholds.vibrationRMSMax ? "critical" : "warning",
        message: `Vibración RMS en ${data.vibrationRMS.toFixed(3)}g excede el ${((data.vibrationRMS / thresholds.vibrationRMSMax) * 100).toFixed(0)}% del umbral`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    // Verificar presión
    if (data.pressure > thresholds.pressureMax * 0.9) {
      alerts.push({
        id: `alert-${Date.now()}-pressure`,
        machineId,
        machineName,
        type: "pressure",
        severity: data.pressure > thresholds.pressureMax ? "critical" : "warning",
        message: `Presión hidráulica en ${data.pressure.toFixed(2)} MPa excede límites seguros`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    // Verificar temperatura
    if (data.temperature > thresholds.temperatureMax * 0.85) {
      alerts.push({
        id: `alert-${Date.now()}-temperature`,
        machineId,
        machineName,
        type: "temperature",
        severity: data.temperature > thresholds.temperatureMax ? "critical" : "warning",
        message: `Temperatura en ${data.temperature.toFixed(1)}°C supera nivel recomendado`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    // Verificar humedad
    if (data.humidity > thresholds.humidityMax) {
      alerts.push({
        id: `alert-${Date.now()}-humidity`,
        machineId,
        machineName,
        type: "humidity",
        severity: "warning",
        message: `Humedad en ${data.humidity.toFixed(0)}% excede límite establecido`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    return alerts
  }

  /**
   * Guarda una alerta en Firestore
   */
  static async saveAlert(alert: Alert): Promise<void> {
    await addDoc(collection(db, "alerts"), {
      ...alert,
      createdAt: Date.now(),
    })
  }

  /**
   * Obtiene alertas desde Firestore
   */
  static async getAlerts(machineId?: string): Promise<Alert[]> {
    let q = query(collection(db, "alerts"))

    if (machineId) {
      q = query(collection(db, "alerts"), where("machineId", "==", machineId))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Alert[]
  }

  /**
   * Reconoce una alerta
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    await updateDoc(doc(db, "alerts", alertId), {
      acknowledged: true,
      acknowledgedAt: Date.now(),
    })
  }
}
