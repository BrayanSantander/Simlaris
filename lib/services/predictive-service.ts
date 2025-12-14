// Servicio de mantenimiento predictivo con ML

import type { Machine, PredictionResult, SensorData } from "@/lib/types"

export class PredictiveService {
  /**
   * Predice mantenimiento usando un modelo simplificado
   * En producción, esto llamaría a un modelo real de TensorFlow.js o Vertex AI
   */
  static predictMaintenance(machine: Machine): PredictionResult {
    const { currentData, status, riskScore } = machine

    // Simulación de predicción basada en datos actuales
    let failureProbability = 0
    let affectedComponent = "Sistema en estado normal"
    let estimatedDaysToMaintenance = 60

    // Análisis de vibración
    if (currentData.vibrationRMS > 0.7) {
      failureProbability += 35
      affectedComponent = "Rodamientos y sistema de suspensión"
      estimatedDaysToMaintenance = Math.min(estimatedDaysToMaintenance, 15)
    } else if (currentData.vibrationRMS > 0.5) {
      failureProbability += 20
      affectedComponent = "Rodamientos"
      estimatedDaysToMaintenance = Math.min(estimatedDaysToMaintenance, 30)
    }

    // Análisis de presión
    if (currentData.pressure > 0.85) {
      failureProbability += 30
      affectedComponent = "Sistema hidráulico y válvulas"
      estimatedDaysToMaintenance = Math.min(estimatedDaysToMaintenance, 10)
    } else if (currentData.pressure > 0.75) {
      failureProbability += 15
    }

    // Análisis de temperatura
    if (currentData.temperature > 80) {
      failureProbability += 20
      affectedComponent = "Sistema de refrigeración"
      estimatedDaysToMaintenance = Math.min(estimatedDaysToMaintenance, 20)
    } else if (currentData.temperature > 75) {
      failureProbability += 10
    }

    // Ajuste basado en estado general
    if (status === "critical") {
      failureProbability += 20
      estimatedDaysToMaintenance = Math.min(estimatedDaysToMaintenance, 5)
    } else if (status === "warning") {
      failureProbability += 10
    }

    // Limitar probabilidad entre 0 y 100
    failureProbability = Math.min(100, failureProbability)

    // Calcular confianza del modelo (simulado)
    const confidence = this.calculateModelConfidence(currentData)

    // Si no hay problemas detectados
    if (failureProbability < 30) {
      affectedComponent = "No se detectan componentes en riesgo"
      estimatedDaysToMaintenance = 60
    }

    return {
      machineId: machine.id,
      failureProbability: Math.round(failureProbability),
      affectedComponent,
      estimatedDaysToMaintenance,
      confidence,
      timestamp: Date.now(),
    }
  }

  /**
   * Calcula la confianza del modelo basada en la calidad de los datos
   */
  private static calculateModelConfidence(data: SensorData): number {
    // Simulación de confianza basada en variabilidad de datos
    let confidence = 95

    // Reducir confianza si los valores están en rangos extremos
    if (data.vibrationRMS > 0.9 || data.vibrationRMS < 0.1) {
      confidence -= 5
    }
    if (data.pressure > 0.95 || data.pressure < 0.3) {
      confidence -= 5
    }
    if (data.temperature > 90 || data.temperature < 50) {
      confidence -= 5
    }

    return Math.max(75, confidence)
  }

  /**
   * Simula la carga de un modelo ML pre-entrenado
   * En producción, esto cargaría un modelo real desde Vertex AI o TensorFlow.js
   */
  static async loadModel(): Promise<boolean> {
    // Simulación de carga de modelo
    console.log("[v0] Cargando modelo de mantenimiento predictivo...")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("[v0] Modelo cargado correctamente")
    return true
  }

  /**
   * Analiza tendencias históricas para predicción más precisa
   */
  static analyzeTrends(historicalData: SensorData[]): {
    vibrationTrend: "increasing" | "stable" | "decreasing"
    pressureTrend: "increasing" | "stable" | "decreasing"
  } {
    if (historicalData.length < 10) {
      return { vibrationTrend: "stable", pressureTrend: "stable" }
    }

    const recentData = historicalData.slice(-20)
    const olderData = historicalData.slice(-40, -20)

    const recentVibrationAvg = recentData.reduce((acc, d) => acc + d.vibrationRMS, 0) / recentData.length
    const olderVibrationAvg = olderData.reduce((acc, d) => acc + d.vibrationRMS, 0) / olderData.length

    const recentPressureAvg = recentData.reduce((acc, d) => acc + d.pressure, 0) / recentData.length
    const olderPressureAvg = olderData.reduce((acc, d) => acc + d.pressure, 0) / olderData.length

    const vibrationTrend =
      recentVibrationAvg > olderVibrationAvg * 1.1
        ? "increasing"
        : recentVibrationAvg < olderVibrationAvg * 0.9
          ? "decreasing"
          : "stable"

    const pressureTrend =
      recentPressureAvg > olderPressureAvg * 1.1
        ? "increasing"
        : recentPressureAvg < olderPressureAvg * 0.9
          ? "decreasing"
          : "stable"

    return { vibrationTrend, pressureTrend }
  }
}
