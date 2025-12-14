import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SensorReading {
  timestamp: number
  vibrationX: number
  vibrationY: number
  vibrationZ: number
  vibrationRMS: number
  gyroscopeX: number
  gyroscopeY: number
  gyroscopeZ: number
  temperature: number
  humidity: number
  pressure: number
}

export interface AnomalyResult {
  isAnomaly: boolean
  severity: "NORMAL" | "ADVERTENCIA" | "CRITICO"
  confidence: number
  metrics: {
    vibrationScore: number
    temperatureScore: number
    gyroscopeScore: number
  }
  recommendations: string[]
}

export interface MaintenanceSchedule {
  machineId: string
  machineName: string
  estimatedDate: string
  daysUntilMaintenance: number
  priority: "low" | "medium" | "high" | "urgent"
  reason: string
  recommendations: string[]
}

export interface MachineAnalysis {
  machineId: string
  machineName: string
  status: "healthy" | "warning" | "critical"
  anomalyResult: AnomalyResult
  trendAnalysis: {
    vibrationTrend: "stable" | "increasing" | "decreasing"
    temperatureTrend: "stable" | "increasing" | "decreasing"
    overallHealth: number // 0-100
  }
  maintenanceSchedule: MaintenanceSchedule
  historicalData: {
    avgVibration: number
    avgTemperature: number
    totalReadings: number
    anomalyCount: number
  }
}

export class AnomalyDetectionService {
  // Calculate z-score for anomaly detection
  private static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0
    return Math.abs((value - mean) / stdDev)
  }

  // Calculate mean
  private static calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  // Calculate standard deviation
  private static calculateStdDev(values: number[], mean: number): number {
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2))
    const avgSquareDiff = this.calculateMean(squareDiffs)
    return Math.sqrt(avgSquareDiff)
  }

  // Get sensor data from Firestore
  static async getSensorData(collectionName: string, numRecords = 100): Promise<SensorReading[]> {
    try {
      const q = query(collection(db, collectionName), orderBy("fecha", "desc"), limit(numRecords))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          timestamp: data.fecha?.seconds * 1000 || Date.now(),
          vibrationX: (data.ax || 0) / 16384,
          vibrationY: (data.ay || 0) / 16384,
          vibrationZ: (data.az || 0) / 16384,
          vibrationRMS: Math.sqrt(
            (Math.pow((data.ax || 0) / 16384, 2) +
              Math.pow((data.ay || 0) / 16384, 2) +
              Math.pow((data.az || 0) / 16384, 2)) /
              3,
          ),
          gyroscopeX: ((data.gx || 0) / 131) * (Math.PI / 180),
          gyroscopeY: ((data.gy || 0) / 131) * (Math.PI / 180),
          gyroscopeZ: ((data.gz || 0) / 131) * (Math.PI / 180),
          temperature: data.temperatura || 0,
          humidity: data.humedad || 0,
          pressure: data.presion_bar || 0,
        }
      })
    } catch (error) {
      console.error("[AnomalyDetection] Error fetching sensor data:", error)
      return []
    }
  }

  // Detect anomalies using statistical analysis
  static async detectAnomalies(collectionName: string): Promise<AnomalyResult> {
    const readings = await this.getSensorData(collectionName, 100)

    if (readings.length < 10) {
      return {
        isAnomaly: false,
        severity: "NORMAL",
        confidence: 0,
        metrics: { vibrationScore: 0, temperatureScore: 0, gyroscopeScore: 0 },
        recommendations: ["Insuficientes datos históricos para análisis"],
      }
    }

    // Get latest reading
    const latest = readings[0]

    // Calculate statistics for historical data (excluding latest)
    const historical = readings.slice(1)

    // Vibration analysis
    const vibrationValues = historical.map((r) => r.vibrationRMS)
    const vibrationMean = this.calculateMean(vibrationValues)
    const vibrationStdDev = this.calculateStdDev(vibrationValues, vibrationMean)
    const vibrationZScore = this.calculateZScore(latest.vibrationRMS, vibrationMean, vibrationStdDev)

    // Temperature analysis
    const temperatureValues = historical.map((r) => r.temperature)
    const temperatureMean = this.calculateMean(temperatureValues)
    const temperatureStdDev = this.calculateStdDev(temperatureValues, temperatureMean)
    const temperatureZScore = this.calculateZScore(latest.temperature, temperatureMean, temperatureStdDev)

    // Gyroscope analysis (total rotation)
    const gyroscopeValues = historical.map((r) =>
      Math.sqrt(Math.pow(r.gyroscopeX, 2) + Math.pow(r.gyroscopeY, 2) + Math.pow(r.gyroscopeZ, 2)),
    )
    const gyroscopeMean = this.calculateMean(gyroscopeValues)
    const gyroscopeStdDev = this.calculateStdDev(gyroscopeValues, gyroscopeMean)
    const latestGyroscopeTotal = Math.sqrt(
      Math.pow(latest.gyroscopeX, 2) + Math.pow(latest.gyroscopeY, 2) + Math.pow(latest.gyroscopeZ, 2),
    )
    const gyroscopeZScore = this.calculateZScore(latestGyroscopeTotal, gyroscopeMean, gyroscopeStdDev)

    // Calculate anomaly score (weighted average of z-scores)
    const anomalyScore = (vibrationZScore * 0.5 + temperatureZScore * 0.3 + gyroscopeZScore * 0.2) / 3

    // Determine severity
    let severity: "NORMAL" | "ADVERTENCIA" | "CRITICO" = "NORMAL"
    let isAnomaly = false

    if (anomalyScore > 2.5) {
      severity = "CRITICO"
      isAnomaly = true
    } else if (anomalyScore > 1.5) {
      severity = "ADVERTENCIA"
      isAnomaly = true
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (vibrationZScore > 2) {
      recommendations.push(
        `Vibración anormal detectada (${latest.vibrationRMS.toFixed(3)} vs promedio ${vibrationMean.toFixed(3)})`,
      )
      recommendations.push("Revisar balanceo de componentes mecánicos")
    }

    if (temperatureZScore > 2) {
      recommendations.push(
        `Temperatura fuera de rango (${latest.temperature.toFixed(1)}°C vs promedio ${temperatureMean.toFixed(1)}°C)`,
      )
      recommendations.push("Verificar sistema de refrigeración y lubricación")
    }

    if (gyroscopeZScore > 2) {
      recommendations.push("Rotación irregular detectada")
      recommendations.push("Inspeccionar rodamientos y alineación del eje")
    }

    if (recommendations.length === 0 && severity === "NORMAL") {
      recommendations.push("Todos los parámetros dentro de rangos normales")
      recommendations.push("Continuar con el monitoreo regular")
    }

    return {
      isAnomaly,
      severity,
      confidence: Math.min(anomalyScore / 3, 1),
      metrics: {
        vibrationScore: vibrationZScore,
        temperatureScore: temperatureZScore,
        gyroscopeScore: gyroscopeZScore,
      },
      recommendations,
    }
  }

  private static calculateMaintenanceDate(
    severity: "NORMAL" | "ADVERTENCIA" | "CRITICO",
    anomalyScore: number,
    vibrationTrend: "stable" | "increasing" | "decreasing",
    temperatureTrend: "stable" | "increasing" | "decreasing",
  ): MaintenanceSchedule {
    let daysUntilMaintenance = 30
    let priority: "low" | "medium" | "high" | "urgent" = "low"
    let reason = ""
    const recommendations: string[] = []

    if (severity === "CRITICO") {
      if (vibrationTrend === "increasing" && temperatureTrend === "increasing") {
        daysUntilMaintenance = 2
        priority = "urgent"
        reason = "Múltiples indicadores críticos en aumento rápido"
        recommendations.push("Detener máquina inmediatamente para inspección")
        recommendations.push("Revisar rodamientos y sistema de lubricación")
        recommendations.push("Verificar alineación y balance de componentes")
      } else if (vibrationTrend === "increasing") {
        daysUntilMaintenance = 3
        priority = "urgent"
        reason = "Vibración crítica en tendencia creciente"
        recommendations.push("Inspección urgente de rodamientos")
        recommendations.push("Verificar balance y alineación")
      } else if (temperatureTrend === "increasing") {
        daysUntilMaintenance = 5
        priority = "urgent"
        reason = "Temperatura crítica en aumento"
        recommendations.push("Revisar sistema de refrigeración")
        recommendations.push("Verificar niveles de lubricante")
      } else {
        daysUntilMaintenance = 7
        priority = "high"
        reason = "Condición crítica detectada"
        recommendations.push("Programar mantenimiento preventivo urgente")
      }
    } else if (severity === "ADVERTENCIA") {
      if (vibrationTrend === "increasing" && temperatureTrend === "increasing") {
        daysUntilMaintenance = 7
        priority = "high"
        reason = "Múltiples indicadores en tendencia de deterioro"
        recommendations.push("Monitoreo continuo de parámetros")
        recommendations.push("Preparar mantenimiento preventivo")
      } else if (vibrationTrend === "increasing" || temperatureTrend === "increasing") {
        daysUntilMaintenance = 14
        priority = "medium"
        reason = "Tendencia de deterioro detectada"
        recommendations.push("Aumentar frecuencia de monitoreo")
        recommendations.push("Planificar inspección detallada")
      } else {
        daysUntilMaintenance = 21
        priority = "medium"
        reason = "Parámetros fuera de rango normal"
        recommendations.push("Monitoreo regular de la condición")
      }
    } else {
      daysUntilMaintenance = 30
      priority = "low"
      reason = "Operación normal, mantenimiento preventivo rutinario"
      recommendations.push("Continuar con monitoreo regular")
      recommendations.push("Mantenimiento preventivo según programa")
    }

    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysUntilMaintenance)

    return {
      machineId: "",
      machineName: "",
      estimatedDate: estimatedDate.toISOString().split("T")[0],
      daysUntilMaintenance,
      priority,
      reason,
      recommendations,
    }
  }

  private static analyzeTrend(values: number[], windowSize = 20): "stable" | "increasing" | "decreasing" {
    if (values.length < windowSize) return "stable"

    const recent = values.slice(0, windowSize)
    const older = values.slice(windowSize, windowSize * 2)

    if (older.length === 0) return "stable"

    const recentAvg = this.calculateMean(recent)
    const olderAvg = this.calculateMean(older)

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100

    if (changePercent > 5) return "increasing"
    if (changePercent < -5) return "decreasing"
    return "stable"
  }

  private static calculateHealthScore(anomalyScore: number, vibrationTrend: string, temperatureTrend: string): number {
    let health = 100

    // Deduct based on anomaly score
    health -= anomalyScore * 15

    // Deduct based on trends
    if (vibrationTrend === "increasing") health -= 10
    if (temperatureTrend === "increasing") health -= 10

    return Math.max(0, Math.min(100, Math.round(health)))
  }

  static async analyzeMachine(
    machineId: string,
    machineName: string,
    collectionName: string,
  ): Promise<MachineAnalysis | null> {
    const readings = await this.getSensorData(collectionName, 100)

    if (readings.length < 10) {
      return null
    }

    // Get latest reading
    const latest = readings[0]
    const historical = readings.slice(1)

    // Vibration analysis
    const vibrationValues = historical.map((r) => r.vibrationRMS)
    const vibrationMean = this.calculateMean(vibrationValues)
    const vibrationStdDev = this.calculateStdDev(vibrationValues, vibrationMean)
    const vibrationZScore = this.calculateZScore(latest.vibrationRMS, vibrationMean, vibrationStdDev)

    // Temperature analysis
    const temperatureValues = historical.map((r) => r.temperature)
    const temperatureMean = this.calculateMean(temperatureValues)
    const temperatureStdDev = this.calculateStdDev(temperatureValues, temperatureMean)
    const temperatureZScore = this.calculateZScore(latest.temperature, temperatureMean, temperatureStdDev)

    // Gyroscope analysis
    const gyroscopeValues = historical.map((r) =>
      Math.sqrt(Math.pow(r.gyroscopeX, 2) + Math.pow(r.gyroscopeY, 2) + Math.pow(r.gyroscopeZ, 2)),
    )
    const gyroscopeMean = this.calculateMean(gyroscopeValues)
    const gyroscopeStdDev = this.calculateStdDev(gyroscopeValues, gyroscopeMean)
    const latestGyroscopeTotal = Math.sqrt(
      Math.pow(latest.gyroscopeX, 2) + Math.pow(latest.gyroscopeY, 2) + Math.pow(latest.gyroscopeZ, 2),
    )
    const gyroscopeZScore = this.calculateZScore(latestGyroscopeTotal, gyroscopeMean, gyroscopeStdDev)

    // Calculate anomaly score
    const anomalyScore = (vibrationZScore * 0.5 + temperatureZScore * 0.3 + gyroscopeZScore * 0.2) / 3

    // Determine severity
    let severity: "NORMAL" | "ADVERTENCIA" | "CRITICO" = "NORMAL"
    let isAnomaly = false
    let status: "healthy" | "warning" | "critical" = "healthy"

    if (anomalyScore > 2.5) {
      severity = "CRITICO"
      isAnomaly = true
      status = "critical"
    } else if (anomalyScore > 1.5) {
      severity = "ADVERTENCIA"
      isAnomaly = true
      status = "warning"
    }

    // Trend analysis
    const vibrationTrend = this.analyzeTrend(vibrationValues.reverse())
    const temperatureTrend = this.analyzeTrend(temperatureValues.reverse())

    // Calculate overall health
    const overallHealth = this.calculateHealthScore(anomalyScore, vibrationTrend, temperatureTrend)

    // Generate recommendations
    const recommendations: string[] = []

    if (vibrationZScore > 2) {
      recommendations.push(
        `Vibración ${vibrationTrend === "increasing" ? "en aumento" : "elevada"}: ${latest.vibrationRMS.toFixed(3)} g (promedio: ${vibrationMean.toFixed(3)} g)`,
      )
      recommendations.push("Inspeccionar rodamientos y verificar balance de componentes rotatorios")
      if (vibrationTrend === "increasing") {
        recommendations.push("Tendencia creciente detectada - programar inspección urgente")
      }
    }

    if (temperatureZScore > 2) {
      recommendations.push(
        `Temperatura ${temperatureTrend === "increasing" ? "en aumento" : "elevada"}: ${latest.temperature.toFixed(1)}°C (promedio: ${temperatureMean.toFixed(1)}°C)`,
      )
      recommendations.push("Revisar sistema de refrigeración y ventilación")
      recommendations.push("Verificar niveles y calidad del lubricante")
      if (temperatureTrend === "increasing") {
        recommendations.push("Tendencia al sobrecalentamiento - atención inmediata requerida")
      }
    }

    if (gyroscopeZScore > 2) {
      recommendations.push("Rotación irregular detectada en sensores giroscópicos")
      recommendations.push("Verificar alineación del eje y estado de cojinetes")
    }

    if (recommendations.length === 0 && severity === "NORMAL") {
      recommendations.push("Todos los parámetros dentro de rangos normales")
      recommendations.push("Mantener programa de monitoreo regular")
      if (overallHealth > 90) {
        recommendations.push("Excelente estado operacional")
      }
    }

    // Calculate maintenance schedule
    const maintenanceSchedule = this.calculateMaintenanceDate(severity, anomalyScore, vibrationTrend, temperatureTrend)
    maintenanceSchedule.machineId = machineId
    maintenanceSchedule.machineName = machineName

    // Count anomalies in historical data
    let anomalyCount = 0
    for (const reading of historical) {
      const vScore = this.calculateZScore(reading.vibrationRMS, vibrationMean, vibrationStdDev)
      const tScore = this.calculateZScore(reading.temperature, temperatureMean, temperatureStdDev)
      const avgScore = (vScore + tScore) / 2
      if (avgScore > 1.5) anomalyCount++
    }

    return {
      machineId,
      machineName,
      status,
      anomalyResult: {
        isAnomaly,
        severity,
        confidence: Math.min(anomalyScore / 3, 1),
        metrics: {
          vibrationScore: vibrationZScore,
          temperatureScore: temperatureZScore,
          gyroscopeScore: gyroscopeZScore,
        },
        recommendations,
      },
      trendAnalysis: {
        vibrationTrend,
        temperatureTrend,
        overallHealth,
      },
      maintenanceSchedule,
      historicalData: {
        avgVibration: vibrationMean,
        avgTemperature: temperatureMean,
        totalReadings: readings.length,
        anomalyCount,
      },
    }
  }
}
