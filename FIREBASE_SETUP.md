# Configuración de Firebase para SIMLARIS

## Índices Compuestos Requeridos

Firebase Firestore requiere índices compuestos para ciertas consultas complejas. SIMLARIS necesita los siguientes índices:

### 1. Índice para `sensor_data`

Este índice es **requerido** para cargar datos históricos de sensores por máquina.

**Campos:**
- `machineId` (Ascending)
- `timestamp` (Ascending)

**Cómo crear:**

1. **Opción Automática (Recomendada):**
   - Abre el dashboard de SIMLARIS
   - Ve a una máquina que tenga datos
   - Abre la consola del navegador (F12)
   - Busca el error que dice "The query requires an index"
   - Haz clic en el enlace proporcionado en el error
   - Firebase te llevará directamente a la página para crear el índice
   - Haz clic en "Crear índice"
   - Espera 1-2 minutos hasta que el estado sea "Enabled"

2. **Opción Manual:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - Ve a **Firestore Database** → **Indexes** → **Composite**
   - Haz clic en **Create Index**
   - Configura:
     - Collection ID: `sensor_data`
     - Fields to index:
       1. `machineId` - Ascending
       2. `timestamp` - Ascending
     - Query scope: Collection
   - Haz clic en **Create**

### 2. Índice para `alerts` (Opcional)

Este índice mejora el rendimiento al filtrar alertas.

**Campos:**
- `acknowledged` (Ascending)
- `timestamp` (Descending)

**Cómo crear:**
Sigue los mismos pasos que arriba, pero usa:
- Collection ID: `alerts`
- Fields:
  1. `acknowledged` - Ascending
  2. `timestamp` - Descending

### 3. Índice para `predictions` (Opcional)

**Campos:**
- `timestamp` (Descending)

Este es un índice simple y Firebase lo crea automáticamente.

## Reglas de Seguridad

Actualiza las reglas de Firestore para permitir que el ESP32 escriba datos:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir escritura en sensor_data desde ESP32
    match /sensor_data/{document=**} {
      allow write: if true; // Solo desarrollo
      allow read: if request.auth != null;
    }
    
    // Proteger máquinas
    match /machines/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Proteger alertas
    match /alerts/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Proteger umbrales
    match /thresholds/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Proteger predicciones
    match /predictions/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Proteger usuarios
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

**⚠️ IMPORTANTE PARA PRODUCCIÓN:**

Las reglas anteriores permiten escritura anónima en `sensor_data` para facilitar el desarrollo. En producción, debes implementar autenticación:

\`\`\`javascript
match /sensor_data/{document=**} {
  // Opción 1: Autenticación por API Key en campo personalizado
  allow write: if request.resource.data.apiKey == "TU_API_KEY_SECRETA";
  
  // Opción 2: Usar Firebase Admin SDK desde un servidor
  // Opción 3: Usar tokens personalizados desde ESP32
  
  allow read: if request.auth != null;
}
\`\`\`

## Verificación de Configuración

### 1. Verificar índices:
- Ve a Firebase Console → Firestore → Indexes
- Confirma que todos los índices estén en estado "Enabled"

### 2. Verificar reglas:
- Ve a Firebase Console → Firestore → Rules
- Confirma que las reglas estén publicadas

### 3. Probar conexión desde ESP32:
- Sube el código al ESP32
- Abre el Monitor Serie
- Verifica que se conecte a WiFi
- Verifica que envíe datos exitosamente (código 200 o 201)

### 4. Verificar en SIMLARIS:
- Ve a Dashboard → Sensores
- Verifica que aparezca el sensor en "Sensores sin asignar"
- Asocia el sensor a una máquina
- Ve a la máquina y verifica que aparezcan los datos

## Solución de Problemas

### Error: "The query requires an index"
- **Causa:** El índice compuesto no existe
- **Solución:** Sigue las instrucciones arriba para crear el índice
- **Nota:** Mientras se crea el índice, SIMLARIS usa una query alternativa que funciona pero es más lenta

### Error: "Missing or insufficient permissions"
- **Causa:** Las reglas de seguridad no permiten la operación
- **Solución:** Verifica que las reglas de Firestore estén correctamente configuradas

### Error: "PERMISSION_DENIED"
- **Causa:** Usuario no autenticado intentando leer datos
- **Solución:** Verifica que el usuario esté logueado

### Los datos no aparecen en el dashboard
1. Verifica que el ESP32 esté enviando datos (Monitor Serie)
2. Verifica en Firebase Console → Firestore que existan documentos en `sensor_data`
3. Verifica que el sensor esté asociado a la máquina correcta
4. Verifica que el `machineId` en los datos coincida con el ID de la máquina

### El índice tarda mucho en crearse
- Los índices normalmente tardan 1-2 minutos
- Si tarda más de 10 minutos, contacta al soporte de Firebase
- Puedes ver el progreso en Firebase Console → Firestore → Indexes

## Monitoreo

### Ver uso de Firestore:
- Firebase Console → Firestore → Usage
- Monitorea lecturas, escrituras y eliminaciones

### Ver errores:
- Firebase Console → Firestore → Monitor
- Revisa errores de queries y permisos

### Límites del plan gratuito:
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 eliminaciones/día
- 1 GiB almacenamiento

Con un ESP32 enviando datos cada 2 segundos, usarás aproximadamente:
- 43,200 escrituras/día (dentro del límite)
- Lecturas dependen del uso del dashboard

## Mejores Prácticas

1. **Crear todos los índices antes de usar en producción**
2. **Implementar autenticación real para escritura en producción**
3. **Monitorear el uso diario de Firestore**
4. **Hacer backup periódico de datos importantes**
5. **Limpiar datos históricos antiguos periódicamente**
6. **Usar batching para escrituras masivas**
7. **Implementar rate limiting en el ESP32**
