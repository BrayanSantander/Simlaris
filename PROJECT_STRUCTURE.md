# Estructura del Proyecto SIMLARIS

## 📁 Estructura de Archivos

\`\`\`
SIMLARIS/
├── app/                          # Carpeta principal de Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/page.tsx       # Página de inicio de sesión
│   │   └── register/page.tsx    # Página de registro
│   │
│   ├── dashboard/               # Dashboard principal (protegido)
│   │   ├── layout.tsx          # Layout del dashboard con navegación
│   │   ├── page.tsx            # Vista general de la flota
│   │   │
│   │   ├── machines/           # Gestión de máquinas
│   │   │   ├── page.tsx       # Lista de todas las máquinas
│   │   │   ├── [id]/page.tsx  # Vista detallada de una máquina
│   │   │   └── loading.tsx    # Estado de carga
│   │   │
│   │   ├── alerts/            # Sistema de alertas
│   │   │   └── page.tsx       # Centro de alertas
│   │   │
│   │   ├── predictive/        # Mantenimiento predictivo
│   │   │   └── page.tsx       # Análisis predictivo ML
│   │   │
│   │   ├── sensors/           # Configuración de sensores
│   │   │   └── page.tsx       # Asociar sensores a máquinas
│   │   │
│   │   ├── settings/          # Configuración
│   │   │   └── page.tsx       # Ajustes de umbrales
│   │   │
│   │   └── users/             # Gestión de usuarios
│   │       ├── page.tsx       # Lista de usuarios (admin)
│   │       └── loading.tsx    # Estado de carga
│   │
│   ├── layout.tsx             # Layout raíz de la aplicación
│   ├── page.tsx               # Página de inicio (redirección)
│   └── globals.css            # Estilos globales y tema
│
├── components/                # Componentes reutilizables
│   ├── ui/                   # Componentes UI de shadcn
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ... (40+ componentes)
│   │
│   ├── charts/              # Componentes de gráficos
│   │   ├── vibration-chart.tsx
│   │   ├── pressure-chart.tsx
│   │   ├── temperature-humidity-chart.tsx
│   │   └── frequency-spectrum-chart.tsx
│   │
│   ├── add-machine-dialog.tsx    # Formulario para agregar máquinas
│   ├── alert-card.tsx            # Tarjeta de alerta
│   ├── auth-guard.tsx            # Protección de rutas
│   ├── dashboard-nav.tsx         # Navegación del dashboard
│   ├── fleet-stats.tsx           # Estadísticas de la flota
│   ├── machine-card.tsx          # Tarjeta de máquina
│   ├── prediction-card.tsx       # Tarjeta de predicción
│   ├── status-badge.tsx          # Badge de estado
│   ├── theme-provider.tsx        # Proveedor de tema
│   └── theme-toggle.tsx          # Botón de cambio de tema
│
├── lib/                     # Lógica de negocio y utilidades
│   ├── services/           # Servicios de la aplicación
│   │   ├── auth-service.ts          # Autenticación Firebase
│   │   ├── firestore-service.ts     # Operaciones Firestore
│   │   ├── sensor-service.ts        # Gestión de sensores
│   │   ├── alert-service.ts         # Sistema de alertas
│   │   ├── predictive-service.ts    # Análisis predictivo
│   │   └── sensor-processing.ts     # Procesamiento de señales
│   │
│   ├── hooks/              # Hooks personalizados
│   │   └── use-auth.ts    # Hook de autenticación
│   │
│   ├── firebase.ts         # Configuración de Firebase
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Utilidades generales
│
├── hooks/                  # Hooks de shadcn
│   ├── use-mobile.ts      # Detección de móvil
│   └── use-toast.ts       # Sistema de toast
│
├── public/                 # Archivos estáticos
│   ├── icon.svg
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── apple-icon.png
│
├── .env.example           # Plantilla de variables de entorno
├── README.md              # Documentación principal
├── FIREBASE_SETUP.md      # Guía de configuración Firebase
├── PROJECT_STRUCTURE.md   # Este archivo
├── package.json           # Dependencias del proyecto
├── tsconfig.json          # Configuración TypeScript
├── next.config.mjs        # Configuración Next.js
└── components.json        # Configuración shadcn

\`\`\`

## 🔥 Estructura de Firebase Firestore

### Colecciones principales:

#### 1. `users`
\`\`\`typescript
{
  uid: string              // ID del usuario (Auth)
  email: string           // Email del usuario
  role: 'admin' | 'supervisor' | 'operador'
  name: string            // Nombre completo
  createdAt: Timestamp    // Fecha de creación
}
\`\`\`

#### 2. `machines`
\`\`\`typescript
{
  id: string              // ID único de la máquina
  name: string            // Nombre de la máquina
  brand: string           // Marca
  model: string           // Modelo
  year: number            // Año
  location: string        // Ubicación
  status: 'operativo' | 'mantenimiento' | 'fuera_de_servicio'
  sensorId?: string       // ID del sensor ESP32 asignado
  thresholds: {           // Umbrales configurables
    vibration: {
      max: number         // RMS máximo (m/s²)
      criticalFreqs: number[]  // Frecuencias críticas (Hz)
    }
    pressure: {
      max: number         // Presión máxima (PSI)
      min: number         // Presión mínima (PSI)
    }
    temperature: {
      max: number         // Temperatura máxima (°C)
      min: number         // Temperatura mínima (°C)
    }
    humidity: {
      max: number         // Humedad máxima (%)
      min: number         // Humedad mínima (%)
    }
    accelerometer: {
      max: number         // Aceleración máxima (m/s²)
    }
    gyroscope: {
      max: number         // Velocidad angular máxima (°/s)
    }
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
\`\`\`

#### 3. `sensor_data`
\`\`\`typescript
{
  sensorId: string        // ID del sensor ESP32
  machineId: string       // ID de la máquina asociada
  timestamp: Timestamp    // Marca de tiempo
  vibration: {
    x: number            // Aceleración en X (m/s²)
    y: number            // Aceleración en Y (m/s²)
    z: number            // Aceleración en Z (m/s²)
    rms: number          // RMS calculado
  }
  gyroscope: {
    x: number            // Velocidad angular X (°/s)
    y: number            // Velocidad angular Y (°/s)
    z: number            // Velocidad angular Z (°/s)
  }
  pressure: number       // Presión hidráulica (MPa)
  temperature: number    // Temperatura (°C)
  humidity: number       // Humedad (%)
}
\`\`\`

#### 4. `alerts`
\`\`\`typescript
{
  id: string
  machineId: string
  type: 'vibration' | 'pressure' | 'temperature' | 'humidity' | 'gyroscope'
  severity: 'critical' | 'warning' | 'info'
  message: string
  value: number
  threshold: number
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: Timestamp
  acknowledgedAt?: Timestamp
  acknowledgedBy?: string
}
\`\`\`

## 🎨 Sistema de Temas

El proyecto utiliza un sistema de temas basado en variables CSS:

### Variables (en `app/globals.css`):
- `--background` - Color de fondo principal
- `--foreground` - Color de texto principal
- `--primary` - Color primario (azul industrial)
- `--secondary` - Color secundario (celeste técnico)
- `--accent` - Color de acento
- `--muted` - Color apagado
- `--destructive` - Color para acciones destructivas

### Modos:
- **Modo claro** - Fondo blanco, textos oscuros
- **Modo oscuro** - Fondo azul oscuro (#0A1628), textos claros

## 🔐 Sistema de Roles

### Permisos por rol:

| Funcionalidad | Admin | Supervisor | Operador |
|--------------|-------|------------|----------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver máquinas | ✅ | ✅ | ✅ |
| Agregar máquinas | ✅ | ✅ | ❌ |
| Configurar umbrales | ✅ | ❌ | ❌ |
| Ver alertas | ✅ | ✅ | ✅ |
| Reconocer alertas | ✅ | ✅ | ❌ |
| Módulo predictivo | ✅ | ✅ | ❌ |
| Configurar sensores | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## 🚀 Flujo de Trabajo

### 1. Configuración inicial
1. Configurar variables de entorno de Firebase
2. Crear usuario administrador
3. Configurar reglas de seguridad en Firestore

### 2. Agregar máquinas
1. Ir a Dashboard → Máquinas
2. Hacer clic en "Agregar Máquina"
3. Completar formulario con datos y umbrales
4. Guardar

### 3. Asociar sensores ESP32
1. Programar ESP32 con ID único
2. Ir a Dashboard → Sensores
3. Asociar sensor detectado con máquina
4. Los datos comenzarán a aparecer automáticamente

### 4. Monitoreo en tiempo real
- Dashboard muestra estado de toda la flota
- Vista detallada muestra gráficos en tiempo real
- Alertas se generan automáticamente al superar umbrales

### 5. Mantenimiento predictivo
- Módulo predictivo analiza patrones de sensores
- Calcula probabilidad de fallo
- Estima tiempo hasta mantenimiento
- Identifica componentes en riesgo

## 📊 Tecnologías Utilizadas

- **Next.js 16** - Framework React con App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Framework de estilos
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos y visualizaciones
- **Firebase** - Backend (Auth + Firestore)
- **Lucide React** - Iconos
- **next-themes** - Gestión de temas
- **Zod** - Validación de esquemas
- **React Hook Form** - Gestión de formularios

## 📝 Archivos de Configuración Importantes

- `next.config.mjs` - Configuración de Next.js
- `tsconfig.json` - Configuración de TypeScript
- `components.json` - Configuración de shadcn
- `.env.example` - Plantilla de variables de entorno
- `package.json` - Dependencias y scripts

## 🔧 Scripts Disponibles

\`\`\`bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Ejecutar linter
\`\`\`

## 📖 Documentación Adicional

- `README.md` - Guía de inicio rápido e instalación
- `FIREBASE_SETUP.md` - Configuración detallada de Firebase
- `PROJECT_STRUCTURE.md` - Este archivo
