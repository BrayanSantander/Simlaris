# Etapa 1: Build
FROM node:20 AS builder

WORKDIR /app

# Instalamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código y compilamos
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:20-slim

WORKDIR /app

# Copiamos lo necesario de la build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Puerto que Cloud Run asigna
ENV PORT 8080
EXPOSE 8080

# Ejecutar Next.js en producción
CMD ["npx", "next", "start", "-p", "8080"]
