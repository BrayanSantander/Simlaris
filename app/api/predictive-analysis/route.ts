import { NextResponse } from "next/server"
import { AnomalyDetectionService } from "@/lib/services/anomaly-detection"
import { FirestoreService } from "@/lib/services/firestore-service"

export async function GET(request: Request) {
  try {
    console.log("[v0] [API] Starting predictive analysis for all machines")

    const machines = await FirestoreService.getMachines()
    console.log(
      `[v0] [API] Found ${machines.length} machines:`,
      machines.map((m) => ({ id: m.id, name: m.name, collection: m.sensorCollectionName })),
    )

    const analyses = []

    for (const machine of machines) {
      if (!machine.sensorCollectionName) {
        console.log(`[v0] [API] Skipping machine ${machine.name} - no sensor collection`)
        continue
      }

      console.log(`[v0] [API] Analyzing machine: ${machine.name} (collection: ${machine.sensorCollectionName})`)

      const analysis = await AnomalyDetectionService.analyzeMachine(
        machine.id,
        machine.name,
        machine.sensorCollectionName,
      )

      if (analysis) {
        analyses.push(analysis)
        console.log(
          `[v0] [API] Analysis complete for ${machine.name} - Status: ${analysis.status}, Priority: ${analysis.maintenanceSchedule.priority}`,
        )
      } else {
        console.log(`[v0] [API] No analysis returned for ${machine.name}`)
      }
    }

    console.log(`[v0] [API] Completed analysis for ${analyses.length} machines`)

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      totalMachines: machines.length,
      analyzedMachines: analyses.length,
      analyses,
    })
  } catch (error: any) {
    console.error("[v0] Error in predictive analysis:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Error en análisis predictivo",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
