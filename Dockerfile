# Dockerfile para Next.js + Cloud Run

FROM node:20-alpine

# Directorio de la app
WORKDIR /app

# Copiar package.json y lockfile
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el proyecto
COPY . .

# Construir Next.js
RUN npm run build

# Cloud Run asigna PORT automáticamente
ENV PORT $PORT
EXPOSE $PORT

# Arrancar la app en producción
CMD ["npm", "start"]
