import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    projectId: process.env.GCP_PROJECT_ID || null,
    dataset: process.env.BQ_DATASET || null,
    model: process.env.BQ_MODEL || null,
    table: process.env.BQ_TABLE || null,
    credentialsConfigured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  });
}
