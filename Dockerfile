# Etapa 1: Build
FROM node:20 AS builder

WORKDIR /app

# Copiamos solo package.json y package-lock para instalar dependencias
COPY package*.json ./

# Instalamos todas las dependencias (dev + prod)
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Compilamos Next.js (TS -> JS)
RUN npm run build

# Etapa 2: Producción
FROM node:20-slim

WORKDIR /app

# Copiamos solo lo necesario desde la etapa de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Puerto que escucha Cloud Run
ENV PORT 8080
EXPOSE 8080

# Ejecuta Next.js en producción
CMD ["npm", "run", "start"]
