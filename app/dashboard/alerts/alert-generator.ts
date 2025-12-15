import type { Machine } from "@/lib/types"
import { FirestoreService } from "./firestore-service"

type SensorData = {
  vibrationRMS: number
  temperature: number
  pressure: number
  humidity: number
  timestamp: number
}

type ThresholdViolation = {
  type: "vibration" | "temperature" | "pressure" | "humidity"
  value: number
  threshold: number
  severity: "warning" | "critical"
}

export class AlertGeneratorService {
  static checkThresholds(machine: Machine, data: SensorData): ThresholdViolation[] {
    if (!machine.thresholds) return []

    const violations: ThresholdViolation[] = []

    const check = (
      type: ThresholdViolation["type"],
      value: number,
      threshold?: number,
    ) => {
      if (!threshold) return
      if (value >= threshold * 1.2) {
        violations.push({ type, value, threshold, severity: "critical" })
      } else if (value >= threshold) {
        violations.push({ type, value, threshold, severity: "warning" })
      }
    }

    check("vibration", data.vibrationRMS, machine.thresholds.vibration)
    check("temperature", data.temperature, machine.thresholds.temperature)
    check("pressure", data.pressure, machine.thresholds.pressure)
    check("humidity", data.humidity, machine.thresholds.humidity)

    return violations
  }

  static async createAlertsForViolations(
    machine: Machine,
    violations: ThresholdViolation[],
    recentCache: Set<string>,
  ) {
    for (const v of violations) {
      const cacheKey = `${machine.id}-${v.type}-${v.severity}`
      if (recentCache.has(cacheKey)) continue

      await FirestoreService.createAlert({
        machineId: machine.id,
        machineName: machine.name,
        type: v.type,
        severity: v.severity,
        message: this.buildMessage(v),
        acknowledged: false,
        createdAt: Date.now(),
      })

      recentCache.add(cacheKey)
    }
  }

  private static buildMessage(v: ThresholdViolation): string {
    const label = {
      vibration: "Vibración",
      temperature: "Temperatura",
      pressure: "Presión",
      humidity: "Humedad",
    }[v.type]

    return `${label} fuera de rango (${v.value} > ${v.threshold})`
  }
}
