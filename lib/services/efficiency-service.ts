import type { Machine, SensorData } from "@/lib/types"
import { AlertGeneratorService } from "./alert-service"

export class EfficiencyService {
  /**
   * Calcula la eficiencia (%) de una máquina según sensores y umbrales
   * 100% = sin alertas
   * 70%  = advertencias
   * 30%  = críticos
   */
  static calculateMachineEfficiency(
    machine: Machine,
    sensorData: SensorData[]
  ): number {
    if (!machine.thresholds || sensorData.length === 0) return 100

    let totalScore = 0

    sensorData.forEach((data) => {
      const violations =
        AlertGeneratorService.checkThresholds(machine, data)

      if (violations.length === 0) {
        totalScore += 100
      } else if (violations.some(v => v.severity === "critical")) {
        totalScore += 30
      } else {
        totalScore += 70
      }
    })

    return Math.round(totalScore / sensorData.length)
  }

  /**
   * Calcula eficiencia promedio de toda la flota
   */
  static calculateFleetEfficiency(
    machines: Machine[],
    sensorsByMachine: Record<string, SensorData[]>
  ): number {
    const efficiencies: number[] = []

    machines.forEach((machine) => {
      const sensors = sensorsByMachine[machine.id]
      if (!sensors || sensors.length === 0) return

      efficiencies.push(
        this.calculateMachineEfficiency(machine, sensors)
      )
    })

    if (efficiencies.length === 0) return 0

    const avg =
      efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length

    return Math.round(avg)
  }
}
