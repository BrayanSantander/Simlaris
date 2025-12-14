# Configuración de BigQuery ML

Esta guía te ayudará a integrar el modelo predictivo de BigQuery ML con el sistema SIMLARIS IoT.

## 1. Crear Service Account en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Navega a **IAM & Admin** > **Service Accounts**
4. Haz clic en **Create Service Account**
5. Completa los campos:
   - **Service account name**: `simlaris-bigquery-ml`
   - **Description**: Service account para acceder a BigQuery ML desde Vercel

## 2. Asignar Roles

Asigna los siguientes roles al Service Account:

- **BigQuery Job User**: Permite ejecutar queries en BigQuery
- **BigQuery Data Viewer**: Permite leer datos de las tablas

Para asignar roles:
1. Selecciona el service account creado
2. Ve a la pestaña **Permissions**
3. Haz clic en **Grant Access**
4. Agrega cada rol mencionado arriba

## 3. Crear y Descargar la Clave JSON

1. En la página del Service Account, ve a la pestaña **Keys**
2. Haz clic en **Add Key** > **Create new key**
3. Selecciona **JSON** como tipo de clave
4. Haz clic en **Create**
5. Se descargará automáticamente un archivo JSON con las credenciales

⚠️ **IMPORTANTE**: Guarda este archivo de forma segura. Nunca lo subas a repositorios públicos.

## 4. Configurar Variables de Entorno en Vercel

### Opción A: Desde el Dashboard de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** > **Environment Variables**
3. Agrega las siguientes variables:

#### GCP_PROJECT_ID
- **Key**: `GCP_PROJECT_ID`
- **Value**: El ID de tu proyecto de Google Cloud (ej: `simlaris-iot-project`)

#### GCP_CREDENTIALS
- **Key**: `GCP_CREDENTIALS`
- **Value**: El contenido completo del archivo JSON descargado (todo en una sola línea)

Ejemplo del formato JSON:
\`\`\`json
{"type":"service_account","project_id":"tu-proyecto","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"simlaris-bigquery-ml@tu-proyecto.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
\`\`\`

4. Asegúrate de seleccionar todos los entornos (Production, Preview, Development)
5. Haz clic en **Save**

### Opción B: Desde Vercel CLI

\`\`\`bash
vercel env add GCP_PROJECT_ID
# Ingresa el valor cuando se te solicite

vercel env add GCP_CREDENTIALS
# Pega el contenido completo del JSON
\`\`\`

## 5. Estructura del Modelo en BigQuery

El modelo debe estar configurado de la siguiente manera:

### Dataset y Tabla
- **Dataset**: `sensor_data`
- **Tabla**: `sensor_readings`
- **Modelo**: `anomaly_model`

### Esquema de la tabla `sensor_readings`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| timestamp | TIMESTAMP | Fecha y hora de la lectura |
| temperatura | FLOAT64 | Temperatura en °C |
| vibracion | FLOAT64 | Nivel de vibración |
| presion | FLOAT64 | Presión en PSI |
| humedad | FLOAT64 | Humedad en % |

### Crear el modelo (si aún no existe)

\`\`\`sql
CREATE OR REPLACE MODEL `tu-proyecto.sensor_data.anomaly_model`
OPTIONS(
  model_type='AUTOENCODER',
  activation_fn='RELU',
  num_hidden_layers=2,
  hidden_units=[8, 4]
) AS
SELECT
  temperatura,
  vibracion,
  presion,
  humedad
FROM
  `tu-proyecto.sensor_data.sensor_readings`
\`\`\`

## 6. Funcionamiento del Sistema

### API Endpoint: `/api/modelo`

La API ejecuta la siguiente query:

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
    MODEL `proyecto.sensor_data.anomaly_model`,
    TABLE `proyecto.sensor_data.sensor_readings`,
    STRUCT(0.8 AS contamination)
  )
ORDER BY timestamp DESC
LIMIT 1
\`\`\`

### Respuesta JSON

\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "sensors": {
    "temperatura": 75.5,
    "vibracion": 0.45,
    "presion": 120.3,
    "humedad": 65.2
  },
  "prediction": {
    "mse": 0.65,
    "severity": "ADVERTENCIA",
    "is_anomaly": true,
    "anomaly_probability": 0.68
  }
}
\`\`\`

### Reglas de Severidad

| MSE | Severidad | Acción |
|-----|-----------|--------|
| < 0.3 | NORMAL | Sin alertas |
| 0.3 - 0.8 | ADVERTENCIA | Crear alerta de advertencia |
| ≥ 0.8 | CRÍTICO | Crear alerta crítica inmediata |

## 7. Módulos del Sistema

### Módulo Predictivo (`/dashboard/predictive`)
- Consume `/api/modelo`
- Muestra estado actual del modelo
- Visualiza sensores y MSE
- No genera alertas

### Módulo Alertas (`/dashboard/alerts`)
- Verifica `/api/modelo` cada 30 segundos
- Genera alertas según severidad
- Gestiona reconocimiento de alertas

## 8. Verificación

Para verificar que todo funciona correctamente:

1. Despliega el proyecto en Vercel
2. Navega a `/dashboard/predictive`
3. Deberías ver los datos del modelo
4. Verifica los logs en Vercel para cualquier error

### Logs de Debug

La aplicación incluye logs de debug con el prefijo `[v0]`:

\`\`\`
[v0] Starting BigQuery ML prediction query
[v0] BigQuery ML prediction result: { mse: 0.65, severity: 'ADVERTENCIA', is_anomaly: true }
[v0] Fetching prediction from /api/modelo
[v0] Prediction received: {...}
\`\`\`

## 9. Troubleshooting

### Error: "Missing credentials"
- Verifica que `GCP_CREDENTIALS` esté configurada correctamente en Vercel
- Asegúrate de que el JSON esté en una sola línea sin saltos de línea

### Error: "Permission denied"
- Verifica que el Service Account tenga los roles correctos
- Revisa que el proyecto ID sea el correcto

### Error: "Table not found"
- Verifica que el dataset `sensor_data` exista
- Asegúrate de que la tabla `sensor_readings` tenga datos
- Confirma que el modelo `anomaly_model` esté entrenado

### No hay predicciones
- Verifica que haya datos en `sensor_readings`
- Revisa los logs de Vercel para errores específicos
- Asegúrate de que el modelo esté entrenado correctamente

## 10. Seguridad

- ✅ Las credenciales solo están en variables de entorno
- ✅ El frontend nunca tiene acceso a las credenciales
- ✅ Todas las queries se ejecutan en el backend
- ✅ La API route es serverless y segura

## Soporte

Para más información sobre BigQuery ML, consulta:
- [Documentación de BigQuery ML](https://cloud.google.com/bigquery-ml/docs)
- [ML.DETECT_ANOMALIES](https://cloud.google.com/bigquery-ml/docs/reference/standard-sql/bigqueryml-syntax-detect-anomalies)
