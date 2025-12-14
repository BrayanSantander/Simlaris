// /api/modelo/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

// Configuración BigQuery
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined,
});

const BQ_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || "",
  dataset: process.env.BQ_DATASET || "firestore_datos",
  model: process.env.BQ_MODEL || "modelo_maquinaria",
  table: process.env.BQ_TABLE || "vista_entrenamiento",
};

export async function GET() {
  try {
    console.log("[API] Ejecutando detección de anomalías...");

    // Consulta SQL: solo máquina operando
    const query = `
      SELECT *
      FROM ML.DETECT_ANOMALIES(
        MODEL \`${BQ_CONFIG.projectId}.${BQ_CONFIG.dataset}.${BQ_CONFIG.model}\`,
        STRUCT(0.1 AS contamination),
        (
          SELECT temperatura, humedad, adc_raw, vibracion_total, rotacion_total
          FROM \`${BQ_CONFIG.projectId}.${BQ_CONFIG.dataset}.${BQ_CONFIG.table}\`
          WHERE NOT (vibracion_total = 0 AND rotacion_total = 0)
          LIMIT 100
        )
      )
      ORDER BY is_anomaly DESC, mean_squared_error DESC
      LIMIT 50
    `;

    const [job] = await bigquery.createQueryJob({ query });
    const [rows] = await job.getQueryResults();

    // Mapeo de resultados
    const anomalies = rows.map((row: any) => ({
      temperatura: row.temperatura,
      humedad: row.humedad,
      adc_raw: row.adc_raw,
      vibracion_total: row.vibracion_total,
      rotacion_total: row.rotacion_total,
      isAnomaly: row.is_anomaly,
      meanSquaredError: row.mean_squared_error,
      estado: row.vibracion_total === 0 && row.rotacion_total === 0 ? "DETENIDA" : "OPERANDO",
    }));

    // Resumen
    const totalAnomalies = anomalies.filter((a) => a.isAnomaly).length;
    const avgMSE = anomalies.reduce((sum, a) => sum + (a.meanSquaredError || 0), 0) / anomalies.length;

    return NextResponse.json({
      status: "success",
      connected: true,
      projectId: BQ_CONFIG.projectId,
      dataset: BQ_CONFIG.dataset,
      model: BQ_CONFIG.model,
      timestamp: new Date().toISOString(),
      summary: {
        totalRecords: anomalies.length,
        totalAnomalies,
        averageMSE: Number.parseFloat(avgMSE.toFixed(3)),
      },
      anomalies,
    });
  } catch (error: any) {
    console.error("[API] Error en detección de anomalías:", error.message);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Error ejecutando predicción",
        hint: error.message.includes("Not found")
          ? "Verifica que el dataset y modelo existan en BigQuery"
          : error.message.includes("permission")
          ? "El Service Account necesita roles: BigQuery User y BigQuery Job User"
          : "Revisa los logs de Vercel para más detalles",
      },
      { status: 500 }
    );
  }
}
