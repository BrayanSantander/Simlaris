# SIMLARIS - Sistema IoT Industrial

**Simulador de Monitoreo y Localización de Anomalías con Redes IoT y Modelos Predictivos**

Sistema web industrial completo para monitoreo en tiempo real de maquinaria pesada con inteligencia artificial predictiva.

## Características Principales

### 🏭 Monitoreo Industrial IoT
- Monitoreo en tiempo real de sensores MPU-6050, presión hidráulica, temperatura y humedad
- Visualización de datos desde ESP32 almacenados en Firebase Firestore
- Dashboards dinámicos con gráficos profesionales usando Recharts
- **Asociación flexible de sensores a máquinas** desde el panel de administración

### 📊 Análisis de Datos
- **Vibración triaxial**: Análisis RMS y detección de picos
- **Análisis FFT**: Espectro de frecuencias para detección de resonancias
- **Presión hidráulica**: Monitoreo con umbrales configurables (PSI)
- **Condiciones ambientales**: Temperatura y humedad

### 🤖 Mantenimiento Predictivo
- Modelo de ML (Autoencoder) para predicción de fallas
- Estimación de tiempo hasta mantenimiento requerido
- Identificación de componentes en riesgo
- Confianza del modelo en predicciones

### 🚨 Sistema de Alertas
- Alertas automáticas basadas en umbrales configurables por máquina
- Clasificación por severidad (info, warning, critical)
- Centro de gestión de alertas
- Reconocimiento y seguimiento de alertas

### 👥 Gestión de Usuarios
- Autenticación con Firebase Auth
- Sistema de roles: Admin, Supervisor, Operador
- Control de acceso basado en permisos

### ⚙️ Configuración de Sensores (Admin)
- Asociación de sensores ESP32 a máquinas específicas
- Detección automática de sensores no asignados
- Monitoreo del estado de conexión de cada sensor
- Gestión visual de la red de sensores IoT

## Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Firebase (Firestore + Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Hardware**: ESP32, MPU-6050, sensores industriales

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno en Vercel o crear archivo `.env.local`:
\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
\`\`\`

4. Iniciar servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

## Primeros Pasos

### 1. Crear una cuenta de administrador
Accede a `/register` y crea tu primera cuenta. Esta será automáticamente asignada como administrador.

### 2. Agregar una máquina
En el dashboard, ve a **Máquinas** y haz clic en **Agregar Máquina**. Completa:
- Nombre de la máquina
- Tipo (Excavadora, Cargador, etc.)
- Ubicación
- Marca, modelo y año
- **Umbrales personalizados** para cada sensor

### 3. Configurar el ESP32
Sigue las instrucciones en la sección **Integración con ESP32** más abajo.

### 4. Asociar el sensor a la máquina
Ve a **Sensores** (solo admins) y asocia el ID del ESP32 con la máquina correspondiente.

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── (auth)/          # Páginas de autenticación
│   ├── dashboard/       # Dashboard y módulos principales
│   │   ├── machines/    # Gestión de máquinas
│   │   ├── alerts/      # Sistema de alertas
│   │   ├── predictive/  # Mantenimiento predictivo
│   │   ├── sensors/     # Configuración de sensores (admin)
│   │   ├── users/       # Gestión de usuarios (admin)
│   │   └── settings/    # Configuración general (admin)
│   └── layout.tsx       # Layout principal
├── components/          # Componentes reutilizables
│   ├── charts/         # Componentes de gráficos
│   └── ui/             # Componentes UI (shadcn)
├── lib/
│   ├── services/       # Servicios de negocio
│   ├── hooks/          # React hooks personalizados
│   ├── types.ts        # Tipos TypeScript
│   └── firebase.ts     # Configuración Firebase
└── public/             # Archivos estáticos
\`\`\`

## Integración con ESP32

### Configuración de Hardware

**Sensores requeridos:**
- **MPU-6050**: Acelerómetro/giroscopio para vibración triaxial (I2C)
- **Sensor de presión**: 0-1 MPa con interfaz I2C o analógica
- **DHT22**: Sensor de temperatura y humedad digital

**Conexiones ESP32:**
\`\`\`
MPU-6050:
  - VCC → 3.3V
  - GND → GND
  - SDA → GPIO 21
  - SCL → GPIO 22

Sensor de Presión (ejemplo analógico):
  - VCC → 3.3V
  - GND → GND
  - OUT → GPIO 34

DHT22:
  - VCC → 3.3V
  - GND → GND
  - DATA → GPIO 4
\`\`\`

### Código ESP32 para SIMLARIS

\`\`\`cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

// ==================== CONFIGURACIÓN ====================
// WiFi
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// Firebase
const char* FIREBASE_PROJECT_ID = "tu-proyecto-id";
const char* FIREBASE_API_KEY = "tu-api-key";

// ID único de este sensor (IMPORTANTE: Este ID se usa para asociar con la máquina)
const char* SENSOR_ID = "ESP32-A1B2C3D4"; // Cambiar por un ID único para cada ESP32

// Pines
#define DHT_PIN 4
#define PRESSURE_PIN 34

// ==================== OBJETOS ====================
Adafruit_MPU6050 mpu;
DHT dht(DHT_PIN, DHT22);

// Variables globales
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 2000; // Enviar cada 2 segundos

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== SIMLARIS IoT Sensor ===");
  Serial.print("Sensor ID: ");
  Serial.println(SENSOR_ID);
  
  // Conectar WiFi
  Serial.print("Conectando a WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi conectado");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Inicializar MPU6050
  if (!mpu.begin()) {
    Serial.println("✗ Error: MPU6050 no encontrado");
    while (1) {
      delay(10);
    }
  }
  Serial.println("✓ MPU6050 inicializado");
  
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  // Inicializar DHT22
  dht.begin();
  Serial.println("✓ DHT22 inicializado");
  
  Serial.println("\n=== Sistema listo ===\n");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentTime;
    
    // Leer sensores
    SensorData data = readSensors();
    
    // Mostrar en Serial
    printSensorData(data);
    
    // Enviar a Firebase
    if (WiFi.status() == WL_CONNECTED) {
      sendToFirestore(data);
    } else {
      Serial.println("✗ WiFi desconectado, reconectando...");
      WiFi.reconnect();
    }
  }
}

struct SensorData {
  float vibrationX;
  float vibrationY;
  float vibrationZ;
  float vibrationRMS;
  float gyroscopeX;
  float gyroscopeY;
  float gyroscopeZ;
  float pressure;
  float temperature;
  float humidity;
  long timestamp;
};

SensorData readSensors() {
  SensorData data;
  
  // Leer MPU6050
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  // Convertir aceleración a g's
  data.vibrationX = a.acceleration.x / 9.81;
  data.vibrationY = a.acceleration.y / 9.81;
  data.vibrationZ = a.acceleration.z / 9.81;
  
  // Calcular RMS
  data.vibrationRMS = sqrt(
    (data.vibrationX * data.vibrationX + 
     data.vibrationY * data.vibrationY + 
     data.vibrationZ * data.vibrationZ) / 3.0
  );
  
  // Giroscopio en grados/segundo
  data.gyroscopeX = g.gyro.x * 57.2958; // Convertir rad/s a deg/s
  data.gyroscopeY = g.gyro.y * 57.2958;
  data.gyroscopeZ = g.gyro.z * 57.2958;
  
  // Leer presión (sensor analógico 0-1 MPa)
  int rawPressure = analogRead(PRESSURE_PIN);
  float voltage = rawPressure * (3.3 / 4095.0);
  data.pressure = (voltage / 3.3) * 1.0; // 0-1 MPa (ajustar según calibración)
  
  // Leer DHT22
  data.temperature = dht.readTemperature();
  data.humidity = dht.readHumidity();
  
  // Timestamp
  data.timestamp = millis();
  
  return data;
}

void printSensorData(SensorData data) {
  Serial.println("--- Lectura de Sensores ---");
  Serial.printf("Vibración: X=%.3f, Y=%.3f, Z=%.3f (RMS=%.3f g)\n", 
                data.vibrationX, data.vibrationY, data.vibrationZ, data.vibrationRMS);
  Serial.printf("Giroscopio: X=%.2f, Y=%.2f, Z=%.2f deg/s\n", 
                data.gyroscopeX, data.gyroscopeY, data.gyroscopeZ);
  Serial.printf("Presión: %.3f MPa\n", data.pressure);
  Serial.printf("Temperatura: %.1f°C\n", data.temperature);
  Serial.printf("Humedad: %.1f%%\n", data.humidity);
  Serial.println();
}

void sendToFirestore(SensorData data) {
  HTTPClient http;
  
  // URL de Firestore REST API
  String url = "https://firestore.googleapis.com/v1/projects/" + 
               String(FIREBASE_PROJECT_ID) + 
               "/databases/(default)/documents/sensor_data?key=" + 
               String(FIREBASE_API_KEY);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Crear documento JSON para Firestore
  StaticJsonDocument<1024> doc;
  
  // IMPORTANTE: Incluir sensorId para asociación
  doc["fields"]["sensorId"]["stringValue"] = SENSOR_ID;
  doc["fields"]["timestamp"]["integerValue"] = String(data.timestamp);
  doc["fields"]["vibrationX"]["doubleValue"] = data.vibrationX;
  doc["fields"]["vibrationY"]["doubleValue"] = data.vibrationY;
  doc["fields"]["vibrationZ"]["doubleValue"] = data.vibrationZ;
  doc["fields"]["vibrationRMS"]["doubleValue"] = data.vibrationRMS;
  doc["fields"]["gyroscopeX"]["doubleValue"] = data.gyroscopeX;
  doc["fields"]["gyroscopeY"]["doubleValue"] = data.gyroscopeY;
  doc["fields"]["gyroscopeZ"]["doubleValue"] = data.gyroscopeZ;
  doc["fields"]["pressure"]["doubleValue"] = data.pressure;
  doc["fields"]["temperature"]["doubleValue"] = data.temperature;
  doc["fields"]["humidity"]["doubleValue"] = data.humidity;
  
  String json;
  serializeJson(doc, json);
  
  int httpCode = http.POST(json);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == 201) {
      Serial.println("✓ Datos enviados a Firebase");
    } else {
      Serial.printf("⚠ Respuesta: %d\n", httpCode);
    }
  } else {
    Serial.printf("✗ Error HTTP: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}
\`\`\`

### Librerías necesarias para ESP32

Instalar en Arduino IDE:
1. **Adafruit MPU6050** (by Adafruit)
2. **Adafruit Unified Sensor** (by Adafruit)
3. **DHT sensor library** (by Adafruit)
4. **ArduinoJson** (by Benoit Blanchon) - versión 6.x

### Pasos para configurar el ESP32:

1. **Obtener credenciales de Firebase:**
   - Ve a Firebase Console → Configuración del proyecto
   - Copia el `Project ID`
   - Ve a Configuración → Web API Key

2. **Modificar el código:**
   - Actualiza `WIFI_SSID` y `WIFI_PASSWORD`
   - Actualiza `FIREBASE_PROJECT_ID` y `FIREBASE_API_KEY`
   - **Cambia `SENSOR_ID`** a un ID único (ej: "ESP32-EXCAVADORA-01")

3. **Subir el código al ESP32:**
   - Conecta el ESP32 por USB
   - Selecciona el puerto correcto en Arduino IDE
   - Compila y sube el código

4. **Verificar funcionamiento:**
   - Abre el Monitor Serie (115200 baud)
   - Verifica que conecte a WiFi
   - Verifica que envíe datos a Firebase
   - Verifica las lecturas de sensores

5. **Asociar en SIMLARIS:**
   - Inicia sesión como admin en SIMLARIS
   - Ve a **Dashboard → Sensores**
   - Verás el sensor detectado en "Sensores sin asignar"
   - Haz clic en "Usar este ID" y selecciona la máquina
   - Haz clic en "Asociar Sensor"

6. **Verificar en Dashboard:**
   - Ve a **Dashboard → Máquinas**
   - Selecciona la máquina asociada
   - Deberías ver los datos en tiempo real actualizándose

### Configuración de Firestore Rules

Para permitir que el ESP32 escriba datos:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir escritura en sensor_data (solo para desarrollo)
    match /sensor_data/{document=**} {
      allow write: if true;
      allow read: if request.auth != null;
    }
    
    // Proteger otras colecciones
    match /machines/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /alerts/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

**⚠️ SEGURIDAD EN PRODUCCIÓN**: Las reglas anteriores permiten escritura anónima en `sensor_data`. Para producción, considera:
- Implementar autenticación con Firebase Admin SDK
- Usar tokens de acceso personalizados
- Restringir por IP o rango de IPs
- Implementar rate limiting

### Solución de Problemas

**El sensor no aparece en "Sensores sin asignar":**
- Verifica que el ESP32 esté conectado a WiFi
- Revisa el Monitor Serie para ver si hay errores HTTP
- Verifica que el Project ID y API Key sean correctos
- Asegúrate de que las reglas de Firestore permitan escritura

**Error 401 (No autorizado):**
- Verifica el API Key de Firebase
- Revisa las reglas de seguridad en Firestore Console

**Error 400 (Bad Request):**
- Verifica el formato JSON en el código ESP32
- Asegúrate de que el Project ID sea correcto

**Lecturas erróneas de sensores:**
- Calibra el MPU6050 en posición de reposo
- Verifica las conexiones I2C (SDA, SCL)
- Comprueba alimentación de sensores (3.3V estable)
- Revisa que no haya cables sueltos o mal conectados

**WiFi se desconecta frecuentemente:**
- Verifica la señal WiFi en la ubicación del ESP32
- Considera usar un router más cercano o repetidor
- Agrega lógica de reconexión automática (ya incluida en el código)

## Módulos del Sistema

### 1. Dashboard General (`/dashboard`)
- Vista general de toda la flota
- Estadísticas en tiempo real
- Alertas destacadas
- Estado de máquinas
- Eficiencia calculada en base a tiempo operativo real

### 2. Gestión de Máquinas (`/dashboard/machines`)
- Lista completa de maquinaria con filtros
- Crear nueva máquina con umbrales personalizados
- Vista detallada individual con gráficos en tiempo real
- Exportar datos históricos
- Selector de períodos (1h, 6h, 24h, 7 días)

### 3. Sistema de Alertas (`/dashboard/alerts`)
- Centro de alertas en tiempo real
- Filtros por severidad (info, warning, critical)
- Reconocimiento de alertas
- Historial completo

### 4. Mantenimiento Predictivo (`/dashboard/predictive`)
- Predicciones por máquina basadas en ML
- Probabilidad de falla estimada
- Componentes en riesgo identificados
- Tiempo estimado hasta mantenimiento

### 5. Configuración de Sensores (`/dashboard/sensors`) - Solo Admin
- Asociar sensores ESP32 a máquinas
- Ver sensores detectados sin asignar
- Monitorear estado de conexión
- Gestión completa de la red IoT

### 6. Configuración Global (`/dashboard/settings`) - Solo Admin
- Umbrales globales del sistema
- Frecuencias críticas
- Parámetros de alertas

### 7. Gestión de Usuarios (`/dashboard/users`) - Solo Admin
- Agregar nuevos usuarios
- Cambiar roles (admin, supervisor, operador)
- Ver estadísticas de usuarios

## Licencia

Proyecto universitario - Holesteck S.A.

## Autor

Desarrollado como proyecto de demostración industrial para Holesteck S.A.
