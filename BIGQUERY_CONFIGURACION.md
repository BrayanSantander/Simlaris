# Configuración de BigQuery ML para SIMLARIS IoT

## Resumen
Este sistema integra el modelo predictivo de BigQuery ML entrenado con `ML.DETECT_ANOMALIES` para detectar anomalías en datos de sensores y generar alertas automáticamente.

## Variables de Entorno Requeridas

Debes configurar las siguientes variables en la sección **Vars** del sidebar de v0:

### 1. GCP_PROJECT_ID
Tu ID de proyecto de Google Cloud Platform.

**Ejemplo:**
\`\`\`
mi-proyecto-iot-123456
\`\`\`

### 2. GCP_CREDENTIALS
Las credenciales de la cuenta de servicio de GCP en formato JSON (sin saltos de línea).

**Cómo obtenerlas:**
1. Ve a Google Cloud Console
2. Navega a "IAM & Admin" > "Service Accounts"
3. Crea o selecciona una cuenta de servicio
4. Crea una nueva clave (JSON)
5. Descarga el archivo JSON
6. **IMPORTANTE:** Copia TODO el contenido del JSON en una sola línea

**Ejemplo del formato:**
\`\`\`json
{"type":"service_account","project_id":"mi-proyecto","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"mi-cuenta@proyecto.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
\`\`\`

## Estructura de BigQuery

El sistema espera la siguiente estructura en BigQuery:

### Dataset: `sensor_data`

### Tabla: `sensor_readings`
\`\`\`sql
CREATE TABLE `tu-proyecto.sensor_data.sensor_readings` (
  timestamp TIMESTAMP,
  temperatura FLOAT64,
  vibracion FLOAT64,
  presion FLOAT64,
  humedad FLOAT64
);
\`\`\`

### Modelo: `anomaly_model`
\`\`\`sql
CREATE MODEL `tu-proyecto.sensor_data.anomaly_model`
OPTIONS(
  model_type='AUTOENCODER',
  activation_fn='RELU',
  l1_reg_activation=0.0001,
  learn_rate=0.001,
  num_trials=3,
  max_parallel_trials=2
) AS
SELECT 
  timestamp,
  temperatura,
  vibracion,
  presion,
  humedad
FROM 
  `tu-proyecto.sensor_data.sensor_readings`;
\`\`\`

## Cómo Funciona

### 1. Detección de Anomalías
El modelo se ejecuta con la función `ML.DETECT_ANOMALIES`:

\`\`\`sql
SELECT
  timestamp,
  temperatura,
  vibracion,
  presion,
  humedad,
  anomaly_probability,
  is_anomaly
FROM
  ML.DETECT_ANOMALIES(
    MODEL `tu-proyecto.sensor_data.anomaly_model`,
    TABLE `tu-proyecto.sensor_data.sensor_readings`,
    STRUCT(0.8 AS contamination)
  )
ORDER BY timestamp DESC
LIMIT 1
\`\`\`

### 2. Cálculo de Severidad
El sistema calcula la severidad basándose en el MSE (Mean Squared Error):

- **NORMAL**: MSE < 0.3
- **ADVERTENCIA**: 0.3 ≤ MSE < 0.8
- **CRÍTICO**: MSE ≥ 0.8

### 3. Generación de Alertas
El módulo de Alertas verifica el modelo cada 30 segundos y:
- Si la severidad es **CRÍTICO**, crea una alerta crítica inmediatamente
- Si la severidad es **ADVERTENCIA**, crea una alerta de advertencia
- Si la severidad es **NORMAL**, no genera alerta

## API Endpoints

### GET /api/modelo
Ejecuta el modelo de BigQuery ML y retorna la predicción actual.

**Respuesta exitosa:**
\`\`\`json
{
  "timestamp": "2025-01-30T10:00:00Z",
  "sensors": {
    "temperatura": 24.5,
    "vibracion": 0.312,
    "presion": 101.3,
    "humedad": 45.2
  },
  "prediction": {
    "mse": 0.45,
    "severity": "ADVERTENCIA",
    "is_anomaly": true,
    "anomaly_probability": 0.65
  }
}
\`\`\`

### GET /api/modelo/health
Verifica la configuración de BigQuery.

**Respuesta exitosa:**
\`\`\`json
{
  "status": "ok",
  "message": "Configuración de BigQuery correcta",
  "details": {
    "GCP_PROJECT_ID": "✓ Configurado",
    "GCP_CREDENTIALS": "✓ Configurado y válido"
  }
}
\`\`\`

## Verificación de Configuración

Para verificar que todo está configurado correctamente:

1. Navega a `/dashboard/predictive`
2. Si ves un error, revisa los logs en la consola
3. Visita `/api/modelo/health` para verificar la configuración
4. Asegúrate de que las variables de entorno estén correctamente configuradas en v0

## Permisos Requeridos

La cuenta de servicio debe tener los siguientes permisos:
- `roles/bigquery.dataViewer`
- `roles/bigquery.jobUser`

## Troubleshooting

### Error: "Missing BigQuery credentials"
- Verifica que hayas configurado `GCP_PROJECT_ID` y `GCP_CREDENTIALS` en Vars

### Error: "Error al parsear las credenciales de GCP"
- Asegúrate de que `GCP_CREDENTIALS` sea un JSON válido
- Copia el contenido del archivo JSON completo, sin modificaciones

### Error: "No hay datos disponibles para analizar"
- Verifica que la tabla `sensor_readings` tenga datos
- Confirma que el modelo `anomaly_model` esté entrenado

### El modelo no detecta anomalías
- Verifica que el modelo esté entrenado con suficientes datos
- Ajusta el parámetro `contamination` en la query (actualmente 0.8)
