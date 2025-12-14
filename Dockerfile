# Dockerfile para Next.js + Firebase en Cloud Run
# Usa Node 20 en versión Alpine para producción
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instala dependencias (producción)
RUN npm install --omit=dev

# Copia el resto de la aplicación
COPY . .

# Copia el archivo de variables de entorno para producción
COPY .env.production .env.production

# Define variables de entorno para que Next.js las use
ENV NODE_ENV=production
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}

# Build de Next.js
RUN npm run build

# Expone el puerto que Cloud Run espera
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
