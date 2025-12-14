// Servicio para procesamiento de datos de sensores

import type { SensorData } from "@/lib/types"

const ACCEL_SCALE = 16384 // LSB/g para rango ±2g
const GYRO_SCALE = 131 // LSB/(°/s) para rango ±250°/s
const GRAVITY = 1.0 // g

export class SensorProcessingService {
  private static emaAccel = 0
  private static emaGyro = 0
  private static gyroBias = { x: 0, y: 0, z: 0 }
  private static windowValues: number[] = []

  /**
   * Convierte datos crudos del acelerómetro (LSB) a unidades físicas (g)
   */
  static convertAccelToG(ax_raw: number, ay_raw: number, az_raw: number): { x: number; y: number; z: number } {
    return {
      x: ax_raw / ACCEL_SCALE,
      y: ay_raw / ACCEL_SCALE,
      z: az_raw / ACCEL_SCALE,
    }
  }

  /**
   * Convierte datos crudos del giroscopio (LSB) a unidades físicas (°/s)
   */
  static convertGyroToDPS(gx_raw: number, gy_raw: number, gz_raw: number): { x: number; y: number; z: number } {
    return {
      x: gx_raw / GYRO_SCALE,
      y: gy_raw / GYRO_SCALE,
      z: gz_raw / GYRO_SCALE,
    }
  }

  /**
   * Calcula la magnitud total de aceleración
   */
  static calculateTotalAcceleration(ax_g: number, ay_g: number, az_g: number): number {
    return Math.sqrt(ax_g ** 2 + ay_g ** 2 + az_g ** 2)
  }

  /**
   * Calcula la magnitud total de rotación
   */
  static calculateTotalRotation(gx_dps: number, gy_dps: number, gz_dps: number): number {
    return Math.sqrt(gx_dps ** 2 + gy_dps ** 2 + gz_dps ** 2)
  }

  /**
   * Corrige la componente de gravedad para obtener vibración real
   */
  static correctGravity(a_total_g: number): number {
    return Math.abs(a_total_g - GRAVITY)
  }

  /**
   * Aplica filtro EMA (Exponential Moving Average) para suavizado
   */
  static applyEMAFilter(currentValue: number, isAccel = true, alpha = 0.2): number {
    if (isAccel) {
      this.emaAccel = alpha * currentValue + (1 - alpha) * this.emaAccel
      return this.emaAccel
    } else {
      this.emaGyro = alpha * currentValue + (1 - alpha) * this.emaGyro
      return this.emaGyro
    }
  }

  /**
   * Procesa datos crudos del sensor y retorna métricas calculadas
   */
  static processRawSensorData(rawData: {
    ax: number
    ay: number
    az: number
    gx: number
    gy: number
    gz: number
  }): {
    accel_g: { x: number; y: number; z: number }
    gyro_dps: { x: number; y: number; z: number }
    a_total_g: number
    w_total_dps: number
    a_vibration_g: number
    emaAccel: number
    emaGyro: number
  } {
    // 1. Convertir a unidades físicas
    const accel_g = this.convertAccelToG(rawData.ax, rawData.ay, rawData.az)
    const gyro_dps = this.convertGyroToDPS(rawData.gx, rawData.gy, rawData.gz)

    // 2. Magnitudes totales
    const a_total_g = this.calculateTotalAcceleration(accel_g.x, accel_g.y, accel_g.z)
    const w_total_dps = this.calculateTotalRotation(gyro_dps.x, gyro_dps.y, gyro_dps.z)

    // 3. Corrección de gravedad
    const a_vibration_g = this.correctGravity(a_total_g)

    // 4. Suavizado con filtro EMA
    const emaAccel = this.applyEMAFilter(a_vibration_g, true)
    const emaGyro = this.applyEMAFilter(w_total_dps, false)

    return {
      accel_g,
      gyro_dps,
      a_total_g,
      w_total_dps,
      a_vibration_g,
      emaAccel,
      emaGyro,
    }
  }

  /**
   * Calcula RMS de vibración sobre una ventana de datos
   */
  static calculateRMS(values: number[]): number {
    if (values.length === 0) return 0
    const sumSquares = values.reduce((sum, val) => sum + val ** 2, 0)
    return Math.sqrt(sumSquares / values.length)
  }

  /**
   * Calcula el pico de vibración
   */
  static calculatePeak(values: number[]): number {
    if (values.length === 0) return 0
    return Math.max(...values)
  }

  /**
   * Calcula el Crest Factor (relación pico/RMS)
   */
  static calculateCrestFactor(peak: number, rms: number): number {
    if (rms === 0) return 0
    return peak / rms
  }

  /**
   * Agrega un valor a la ventana y calcula métricas
   */
  static addToWindow(value: number, windowSize = 500): { rms: number; peak: number; crestFactor: number } {
    this.windowValues.push(value)

    // Mantener tamaño de ventana
    if (this.windowValues.length > windowSize) {
      this.windowValues.shift()
    }

    const rms = this.calculateRMS(this.windowValues)
    const peak = this.calculatePeak(this.windowValues)
    const crestFactor = this.calculateCrestFactor(peak, rms)

    return { rms, peak, crestFactor }
  }

  /**
   * Calibra el sesgo del giroscopio (llamar en reposo)
   */
  static calibrateGyroBias(samples: { gx: number; gy: number; gz: number }[]): void {
    if (samples.length === 0) return

    const sum = samples.reduce(
      (acc, sample) => ({
        x: acc.x + sample.gx / GYRO_SCALE,
        y: acc.y + sample.gy / GYRO_SCALE,
        z: acc.z + sample.gz / GYRO_SCALE,
      }),
      { x: 0, y: 0, z: 0 },
    )

    this.gyroBias = {
      x: sum.x / samples.length,
      y: sum.y / samples.length,
      z: sum.z / samples.length,
    }
  }

  /**
   * Calcula el RMS (Root Mean Square) de las vibraciones triaxiales
   */
  static calculateVibrationRMS(x: number, y: number, z: number): number {
    return Math.sqrt((x * x + y * y + z * z) / 3)
  }

  /**
   * Detecta picos en la vibración
   */
  static detectVibrationPeaks(data: SensorData[], threshold: number): number[] {
    const peaks: number[] = []

    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].vibrationRMS
      const current = data[i].vibrationRMS
      const next = data[i + 1].vibrationRMS

      if (current > prev && current > next && current > threshold) {
        peaks.push(i)
      }
    }

    return peaks
  }

  /**
   * Calcula FFT simplificado para análisis de frecuencias
   * (versión simplificada para demo)
   */
  static calculateFrequencySpectrum(data: number[]): { frequency: number; magnitude: number }[] {
    const spectrum: { frequency: number; magnitude: number }[] = []
    const sampleRate = 100 // Hz

    // Simulación simplificada de FFT
    for (let freq = 0; freq < 50; freq += 1) {
      let magnitude = 0
      for (let i = 0; i < Math.min(data.length, 256); i++) {
        const angle = (2 * Math.PI * freq * i) / sampleRate
        magnitude += Math.abs(data[i] * Math.cos(angle))
      }
      spectrum.push({ frequency: freq, magnitude: magnitude / data.length })
    }

    return spectrum
  }

  /**
   * Calcula la eficiencia operativa basada en los parámetros
   */
  static calculateEfficiency(
    data: SensorData,
    thresholds: {
      vibrationMax: number
      pressureMax: number
      temperatureMax: number
    },
  ): number {
    const vibrationScore = Math.max(0, 1 - data.vibrationRMS / thresholds.vibrationMax)
    const pressureScore = Math.max(0, 1 - data.pressure / thresholds.pressureMax)
    const temperatureScore = Math.max(0, 1 - data.temperature / thresholds.temperatureMax)

    return Math.round(((vibrationScore + pressureScore + temperatureScore) / 3) * 100)
  }

  /**
   * Calcula el score de riesgo (0-100)
   */
  static calculateRiskScore(
    data: SensorData,
    thresholds: {
      vibrationMax: number
      pressureMax: number
      temperatureMax: number
    },
  ): number {
    let risk = 0

    if (data.vibrationRMS > thresholds.vibrationMax * 0.8) {
      risk += 30
    }
    if (data.pressure > thresholds.pressureMax * 0.9) {
      risk += 40
    }
    if (data.temperature > thresholds.temperatureMax * 0.85) {
      risk += 30
    }

    return Math.min(100, risk)
  }
}
