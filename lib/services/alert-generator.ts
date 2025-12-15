import { FirestoreService } from "./firestore-service"
import type { Machine, SensorData, Alert } from "@/lib/types"

export interface ThresholdViolation {
  type: "vibration" | "temperature" | "pressure" | "humidity"
  value: number
  threshold: number
  severity: "warning" | "critical"
}

export class AlertGeneratorService {
  /**
   * Verifica si los datos del sensor violan algún umbral configurado
   */
  static checkThresholds(machine: Machine, data: SensorData): ThresholdViolation[] {
    const violations: ThresholdViolation[] = []
    const thresholds = machine.thresholds

    if (!thresholds) return violations

    // Vibración RMS (convertir a m/s² para comparar con maxAcceleration)
    const vibrationMS2 = data.vibrationRMS * 9.81 // g a m/s²
    if (thresholds.maxAcceleration > 0) {
      if (vibrationMS2 > thresholds.maxAcceleration * 1.5) {
        violations.push({
          type: "vibration",
          value: vibrationMS2,
          threshold: thresholds.maxAcceleration,
          severity: "critical",
        })
      } else if (vibrationMS2 > thresholds.maxAcceleration) {
        violations.push({
          type: "vibration",
          value: vibrationMS2,
          threshold: thresholds.maxAcceleration,
          severity: "warning",
        })
      }
    }

    // Temperatura
    if (thresholds.maxTemperature > 0) {
      if (data.temperature > thresholds.maxTemperature * 1.2) {
        violations.push({
          type: "temperature",
          value: data.temperature,
          threshold: thresholds.maxTemperature,
          severity: "critical",
        })
      } else if (data.temperature > thresholds.maxTemperature) {
        violations.push({
          type: "temperature",
          value: data.temperature,
          threshold: thresholds.maxTemperature,
          severity: "warning",
        })
      }
    }

    // Presión (convertir bar a PSI)
    const pressurePSI = data.pressure * 145.038
    if (thresholds.maxPressurePSI > 0) {
      if (pressurePSI > thresholds.maxPressurePSI * 1.2) {
        violations.push({
          type: "pressure",
          value: pressurePSI,
          threshold: thresholds.maxPressurePSI,
          severity: "critical",
        })
      } else if (pressurePSI > thresholds.maxPressurePSI) {
        violations.push({
          type: "pressure",
          value: pressurePSI,
          threshold: thresholds.maxPressurePSI,
          severity: "warning",
        })
      }
    }

    // Humedad
    if (thresholds.maxHumidity > 0) {
      if (data.humidity > thresholds.maxHumidity * 1.2) {
        violations.push({
          type: "humidity",
          value: data.humidity,
          threshold: thresholds.maxHumidity,
          severity: "critical",
        })
      } else if (data.humidity > thresholds.maxHumidity) {
        violations.push({
          type: "humidity",
          value: data.humidity,
          threshold: thresholds.maxHumidity,
          severity: "warning",
        })
      }
    }

    return violations
  }

  /**
   * Genera mensajes de alerta según el tipo de violación
   */
  static generateAlertMessage(violation: ThresholdViolation): string {
    const typeNames: Record<string, string> = {
      vibration: "Vibración",
      temperature: "Temperatura",
      pressure: "Presión",
      humidity: "Humedad",
    }

    const units: Record<string, string> = {
      vibration: "m/s²",
      temperature: "°C",
      pressure: "PSI",
      humidity: "%",
    }

    const severityText = violation.severity === "critical" ? "CRÍTICO" : "ADVERTENCIA"

    return `${severityText}: ${typeNames[violation.type]} en ${violation.value.toFixed(1)} ${units[violation.type]} (umbral: ${violation.threshold.toFixed(1)} ${units[violation.type]})`
  }

  /**
   * Crea alertas en Firestore para las violaciones detectadas
   */
  static async createAlertsForViolations(
    machine: Machine,
    violations: ThresholdViolation[],
    existingAlertTypes: Set<string>,
  ): Promise<void> {
    for (const violation of violations) {
      // Evitar crear alertas duplicadas del mismo tipo en los últimos 5 minutos
      const alertKey = `${machine.id}-${violation.type}-${violation.severity}`
      if (existingAlertTypes.has(alertKey)) continue

      const alert: Omit<Alert, "id"> = {
        machineId: machine.id,
        machineName: machine.name,
        type: violation.type,
        severity: violation.severity,
        message: this.generateAlertMessage(violation),
        timestamp: Date.now(),
        acknowledged: false,
      }

      await FirestoreService.createAlert(alert)
      existingAlertTypes.add(alertKey)
    }
  }
}
