import { BigQuery } from "@google-cloud/bigquery"

export const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined,
  location: "southamerica-west1",
})

export const BQ_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || "simlaris",
  dataset: "modelo_maquinaria",
  model: "modelo_entrenamiento",
  table: "vista_entrenamiento",
}
