import { bigquery, BQ_CONFIG } from "./bigquery"

export interface PredictionInput {
  vibration_x?: number
  vibration_y?: number
  vibration_z?: number
  temperature?: number
  pressure?: number
  humidity?: number
  gyroscope_x?: number
  gyroscope_y?: number
  gyroscope_z?: number
}

export interface AnomalyResult {
  is_anomaly: boolean
  anomaly_probability: number
  normalized_anomaly_score: number
  vibration_x?: number
  vibration_y?: number
  vibration_z?: number
  temperature?: number
  pressure?: number
  humidity?: number
}

export async function detectAnomalies(limit = 100): Promise<AnomalyResult[]> {
  const { projectId, dataset, model, table } = BQ_CONFIG

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID no está configurado")
  }

  const query = `
    SELECT 
      *
    FROM 
      ML.DETECT_ANOMALIES(
        MODEL \`${projectId}.${dataset}.${model}\`,
        STRUCT(0.5 AS contamination),
        (
          SELECT * 
          FROM \`${projectId}.${dataset}.${table}\` 
          ORDER BY timestamp DESC 
          LIMIT ${limit}
        )
      )
    ORDER BY is_anomaly DESC, anomaly_probability DESC
    LIMIT 20
  `

  const [job] = await bigquery.createQueryJob({ query })
  const [rows] = await job.getQueryResults()

  return rows as AnomalyResult[]
}

export async function predictMaintenance(data: PredictionInput) {
  const { projectId, dataset, model } = BQ_CONFIG

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID no está configurado")
  }

  const query = `
    SELECT *
    FROM ML.PREDICT(
      MODEL \`${projectId}.${dataset}.${model}\`,
      (
        SELECT
          @vibration_x AS vibration_x,
          @vibration_y AS vibration_y,
          @vibration_z AS vibration_z,
          @temperature AS temperature,
          @pressure AS pressure,
          @humidity AS humidity
      )
    )
  `

  const [job] = await bigquery.createQueryJob({
    query,
    params: {
      vibration_x: data.vibration_x || 0,
      vibration_y: data.vibration_y || 0,
      vibration_z: data.vibration_z || 0,
      temperature: data.temperature || 0,
      pressure: data.pressure || 0,
      humidity: data.humidity || 0,
    },
  })

  const [rows] = await job.getQueryResults()
  return rows[0]
}
