import type { Machine, SensorData } from "@/lib/types"
import { AlertGeneratorService } from "./alert-service"

export class EfficiencyService {
  /**
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
  }
}
