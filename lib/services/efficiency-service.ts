import type { Machine, SensorData } from "@/lib/types"
import { AlertGeneratorService } from "./alert-service"

export class EfficiencyService {
  /**
<<<<<<< HEAD
   * Calcula eficiencia (%) de una máquina según sus sensores y umbrales
   */
  static calculateMachineEfficiency(
    machine: Machine,
    sensorData: SensorData[],
  ): number {
    if (!machine.thresholds || sensorData.length === 0) return 100

    let score = 0

    sensorData.forEach((data) => {
      const violations = AlertGeneratorService.checkThresholds(machine, data)

      if (violations.length === 0) score += 100
      else if (violations.some((v) => v.severity === "critical")) score += 30
      else score += 70
    })

    return Math.round(score / sensorData.length)
  }

  /**
   * Promedio de eficiencia de toda la flota
   */
  static calculateFleetEfficiency(
    machines: Machine[],
    sensorsByMachine: Record<string, SensorData[]>,
  ): number {
    if (machines.length === 0) return 0

    const efficiencies = machines.map((machine) =>
      this.calculateMachineEfficiency(
        machine,
        sensorsByMachine[machine.id] || [],
      ),
    )

    return Math.round(
      efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length,
    )
=======
   * Calcula eficiencia en base al cumplimiento de umbrales
   * 100% = sin violaciones
   * 70% = advertencias
   * 30% = crítico
   */
  static calculateEfficiency(
    machine: Machine,
    sensorData: SensorData[],
  ): number {
    if (!sensorData.length || !machine.thresholds) return 0

    let totalScore = 0

    for (const data of sensorData) {
      const violations =
        AlertGeneratorService.checkThresholds(machine, data)

      if (violations.length === 0) {
        totalScore += 100
      } else if (violations.some(v => v.severity === "critical")) {
        totalScore += 30
      } else {
        totalScore += 70
      }
    }

    return Math.round(totalScore / sensorData.length)
>>>>>>> 39cda58 (Agregar EfficiencyService y actualizar tsconfig)
  }
}
