import { NextResponse } from "next/server"
import { AnomalyDetectionService } from "@/lib/services/anomaly-detection"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || "prueba"

    console.log("[API] Running local anomaly detection on collection:", collection)

    const result = await AnomalyDetectionService.detectAnomalies(collection)
    const sensorData = await AnomalyDetectionService.getSensorData(collection, 1)

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      collection,
      analysis: result,
      latestReading: sensorData[0] || null,
    })
  } catch (error: any) {
    console.error("[API] Error in local anomaly detection:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Error en análisis de anomalías",
      },
      { status: 500 },
    )
  }
}
