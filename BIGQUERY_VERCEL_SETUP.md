# Configuración de BigQuery ML en Vercel - SIMLARIS IoT

## Paso a Paso (Funcionando en Vercel)

### 1. Preparar Credenciales en Google Cloud (una sola vez)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a **IAM & Admin → Service Accounts**
3. Crea un nuevo Service Account o selecciona uno existente
4. Asigna los siguientes roles:
   - ✓ **BigQuery User**
   - ✓ **BigQuery Job User**
5. Crea una Key JSON:
   - Click en el Service Account
   - Keys → Add Key → Create new key → JSON
   - Descarga el archivo JSON
6. Abre el archivo JSON y **copia TODO el contenido**

### 2. Configurar Variables de Entorno en Vercel

En tu proyecto Vercel:

1. Ve a **Settings → Environment Variables**
2. Agrega las siguientes variables:

#### Variable 1: Credenciales (OBLIGATORIA)
\`\`\`
Name: GOOGLE_APPLICATION_CREDENTIALS_JSON
Value: { TODO EL CONTENIDO DEL JSON DE CREDENCIALES }
Environment: Production + Preview + Development
\`\`\`

#### Variable 2: ID del Proyecto (OBLIGATORIA)
\`\`\`
Name: GCP_PROJECT_ID
Value: simlaris-iot-445623
Environment: Production + Preview + Development
\`\`\`

#### Variables 3-4: Configuración del Modelo (OPCIONAL)
\`\`\`
Name: BQ_DATASET
Value: modelo_predictivo_mantenimiento
Environment: Production + Preview + Development

Name: BQ_MODEL
Value: anomaly_detection_model
Environment: Production + Preview + Development
\`\`\`

3. Guarda y **redeploya** el proyecto

### 3. Verificar la Conexión

#### Opción A: Desde el Dashboard
1. Ve a `/dashboard/diagnostics` en tu aplicación
2. El sistema verificará automáticamente la conexión
3. Verás el estado de BigQuery y estadísticas de anomalías

#### Opción B: Desde la API directamente
\`\`\`bash
curl https://TU-PROYECTO.vercel.app/api/modelo
\`\`\`

#### Respuesta Exitosa:
\`\`\`json
{
  "status": "success",
  "connected": true,
  "projectId": "simlaris-iot-445623",
  "dataset": "modelo_predictivo_mantenimiento",
  "model": "anomaly_detection_model",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "summary": {
    "totalRecords": 20,
    "totalAnomalies": 5,
    "averageAnomalyScore": 0.342
  },
  "anomalies": [...]
}
\`\`\`

### 4. Solución de Problemas Comunes

#### Error: "BigQuery no configurado"
**Causa:** Faltan las variables de entorno
**Solución:** Verifica que `GCP_PROJECT_ID` y `GOOGLE_APPLICATION_CREDENTIALS_JSON` estén configuradas

#### Error: "permission denied"
**Causa:** El Service Account no tiene los permisos necesarios
**Solución:** Asegúrate de que tiene los roles:
- BigQuery User
- BigQuery Job User

#### Error: "Not found: Dataset/Model"
**Causa:** El dataset o modelo no existe en BigQuery
**Solución:** Verifica que el modelo esté creado en BigQuery:
\`\`\`sql
-- Verificar que el modelo existe
SELECT * FROM `simlaris-iot-445623.modelo_predictivo_mantenimiento.INFORMATION_SCHEMA.MODELS`
WHERE model_name = 'anomaly_detection_model'
\`\`\`

#### Error: "Unexpected token '<'"
**Causa:** La API está devolviendo HTML en vez de JSON
**Solución:** 
- Verifica que estás llamando a `/api/modelo` (no `/modelo`)
- Redeploya después de configurar las variables de entorno

### 5. Arquitectura del Sistema

\`\`\`
┌─────────────────┐
│   Frontend      │
│  (Dashboard)    │
└────────┬────────┘
         │
         │ HTTP GET /api/modelo
         │
         ▼
┌─────────────────┐
│  API Route      │
│  /api/modelo    │
└────────┬────────┘
         │
         │ detectAnomalies()
         │
         ▼
┌─────────────────┐
│  lib/predict.ts │
│  (ML Logic)     │
└────────┬────────┘
         │
         │ bigquery.createQueryJob()
         │
         ▼
┌─────────────────┐
│  BigQuery ML    │
│  ML.DETECT_     │
│  ANOMALIES      │
└─────────────────┘
\`\`\`

### 6. Consulta SQL Ejecutada

El sistema ejecuta la siguiente consulta en BigQuery:

\`\`\`sql
SELECT *
FROM ML.DETECT_ANOMALIES(
  MODEL `simlaris-iot-445623.modelo_predictivo_mantenimiento.anomaly_detection_model`,
  STRUCT(0.5 AS contamination),
  (
    SELECT * 
    FROM `simlaris-iot-445623.modelo_predictivo_mantenimiento.sensor_data` 
    ORDER BY timestamp DESC 
    LIMIT 100
  )
)
ORDER BY is_anomaly DESC, anomaly_probability DESC
LIMIT 20
\`\`\`

### 7. Integración con Módulos

Los siguientes módulos consumen la API de BigQuery ML:

- **Predictivo** (`/dashboard/predictive`): Muestra análisis de anomalías en tiempo real
- **Alertas** (`/dashboard/alerts`): Genera alertas críticas basadas en anomalías detectadas

### 8. Confirmación de Funcionamiento

Si ves lo siguiente, BigQuery ML está funcionando correctamente:

✓ El endpoint `/api/modelo` responde JSON (no HTML)
✓ Los logs de Vercel muestran "Anomalías detectadas: X"
✓ BigQuery muestra Jobs ejecutados en la consola
✓ El módulo Predictivo muestra datos reales

### 9. Frase para tu Informe

"El modelo entrenado en BigQuery ML es consumido mediante una API serverless desplegada en Vercel, la cual ejecuta consultas ML.DETECT_ANOMALIES en tiempo real para detectar anomalías en los datos de sensores IoT."
