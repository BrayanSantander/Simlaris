import type { Machine, SensorData } from "@/lib/types"
import { AlertGeneratorService } from "./alert-service"

export class EfficiencyService {
  /**
   * Calcula eficiencia (%) según las últimas lecturas del sensor
   */
  static calculateEfficiency(
    machine: Machine,
    sensorData: SensorData[],
  ): number {
    if (!sensorData.length || !machine.thresholds) return 0

    let totalScore = 0

    for (const data of sensorData) {
      const violations = AlertGeneratorService.checkThresholds(machine, data)

      if (violations.length === 0) {
        totalScore += 100
      } else if (violations.some(v => v.severity === "critical")) {
        totalScore += 30
      } else {
        totalScore += 70
      }
    }

    return Math.round(totalScore / sensorData.length)
  }
}
