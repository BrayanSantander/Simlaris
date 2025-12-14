# Dockerfile para Next.js en Cloud Run
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y lockfile
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependencias (producción)
RUN npm install --omit=dev

# Copiar el resto del proyecto
COPY . .

# Construir la app
RUN npm run build

# Puerto que usa Cloud Run
ENV PORT 8080

# Comando para iniciar la app
CMD ["npm", "start"]
