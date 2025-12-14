# Guía de Configuración del Administrador - SIMLARIS

## Método 1: Crear Administrador Manualmente en Firebase Console (Recomendado)

Esta es la forma más simple y directa de crear tu primer usuario administrador.

### Paso 1: Crear el Usuario en Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto SIMLARIS
3. En el menú lateral, haz clic en **Authentication**
4. Haz clic en la pestaña **Users**
5. Haz clic en **Add user**
6. Ingresa:
   - **Email**: `admin@simlaris.com` (o el email que prefieras)
   - **Password**: Una contraseña segura (mínimo 6 caracteres)
7. Haz clic en **Add user**
8. **IMPORTANTE**: Copia el **User UID** que aparece en la tabla (algo como `xYz123AbC456...`)

### Paso 2: Asignar Rol de Administrador en Firestore

1. En el menú lateral de Firebase Console, haz clic en **Firestore Database**
2. Haz clic en **Start collection** (si es la primera vez) o busca la colección **users**
3. Crea un nuevo documento:
   - **Document ID**: Pega el **User UID** que copiaste en el Paso 1
   - Agrega los siguientes campos:
     \`\`\`
     email: admin@simlaris.com (string)
     displayName: Administrador SIMLARIS (string)
     role: admin (string)
     createdAt: [timestamp actual en milisegundos] (number)
     \`\`\`
4. Haz clic en **Save**

### Paso 3: Iniciar Sesión

1. Ve a tu aplicación SIMLARIS en `http://localhost:3000/login` (o tu URL de producción)
2. Ingresa el email y contraseña que configuraste
3. Haz clic en **Iniciar sesión**
4. Ahora tienes acceso completo como administrador

---

## Método 2: Usar el Script Automatizado

Si prefieres automatizar el proceso, puedes usar el script incluido.

### Requisitos

- Node.js instalado
- Variables de entorno de Firebase configuradas

### Pasos

1. Abre el archivo `scripts/create-admin.ts`
2. Modifica las siguientes líneas con tus datos:
   \`\`\`typescript
   const adminEmail = "admin@simlaris.com"
   const adminPassword = "Admin123456" // ⚠️ Cambiar por contraseña segura
   const adminName = "Administrador SIMLARIS"
   \`\`\`

3. Ejecuta el script:
   \`\`\`bash
   npx tsx scripts/create-admin.ts
   \`\`\`

4. Si todo sale bien, verás:
   \`\`\`
   ✅ Usuario administrador creado exitosamente
   Email: admin@simlaris.com
   Rol: admin
   \`\`\`

---

## Método 3: Promover un Usuario Existente a Administrador

Si ya tienes un usuario registrado y quieres hacerlo administrador:

1. Ve a **Firestore Database** en Firebase Console
2. Busca la colección **users**
3. Encuentra el documento con el **UID del usuario**
4. Edita el campo `role` y cámbialo de `operador` a `admin`
5. Guarda los cambios
6. El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto

---

## Roles Disponibles en SIMLARIS

El sistema tiene tres niveles de roles:

### 1. Administrador (`admin`)
- Acceso completo al sistema
- Puede gestionar usuarios
- Puede configurar umbrales globales
- Puede asociar sensores a máquinas
- Puede crear, editar y eliminar máquinas
- Acceso a todos los módulos

### 2. Supervisor (`supervisor`)
- Puede ver todos los dashboards
- Puede ver y reconocer alertas
- Puede ver el módulo predictivo
- **NO puede** gestionar usuarios
- **NO puede** modificar configuraciones

### 3. Operador (`operador`)
- Puede ver dashboards de lectura
- Puede ver máquinas y datos en tiempo real
- Acceso limitado a funciones avanzadas
- **NO puede** gestionar usuarios ni configuraciones

---

## Acceso al Módulo de Configuración

Una vez que tengas tu usuario administrador:

1. Inicia sesión en SIMLARIS
2. En la navegación superior, verás el enlace **Configuración** (solo visible para administradores)
3. Dentro de Configuración encontrarás dos pestañas:
   - **Asociar Sensores**: Para conectar sensores ESP32 a máquinas
   - **Editar Umbrales**: Para modificar los umbrales de alerta de cada máquina

---

## Solución de Problemas

### No puedo ver el módulo de Configuración
- Verifica que tu usuario tenga el rol `admin` en Firestore
- Cierra sesión y vuelve a iniciar sesión
- Limpia el caché del navegador

### Error "auth/email-already-in-use"
- El email ya está registrado
- Usa el Método 3 para promover el usuario existente a admin

### No puedo crear el primer usuario
- Verifica que Firebase Authentication esté habilitado
- Verifica que las variables de entorno estén configuradas correctamente
- Revisa la configuración de seguridad de Firestore

---

## Seguridad

⚠️ **IMPORTANTE**: 
- Cambia la contraseña por defecto inmediatamente después del primer inicio de sesión
- No compartas las credenciales de administrador
- Usa contraseñas fuertes (mínimo 12 caracteres, con mayúsculas, minúsculas, números y símbolos)
- Considera habilitar autenticación de dos factores en Firebase

---

## Siguiente Paso

Una vez que tengas tu usuario administrador configurado:

1. Ve a **Dashboard → Configuración → Asociar Sensores**
2. Ingresa el ID de tu sensor ESP32 (ej: "ESP32-EXCAVADORA-01")
3. Selecciona la máquina a la que quieres asociarlo
4. Haz clic en **Asociar Sensor**
5. Los datos comenzarán a aparecer en el dashboard de esa máquina

¡Listo! Tu sistema SIMLARIS está completamente configurado.
