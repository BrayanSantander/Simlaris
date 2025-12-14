# Dockerfile para Next.js + Cloud Run

# 1️⃣ Imagen base oficial de Node.js LTS
FROM node:20-alpine

# 2️⃣ Crear directorio de la app
WORKDIR /app

# 3️⃣ Copiar package.json y lock file
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 4️⃣ Instalar dependencias (producción)
RUN npm install --production

# 5️⃣ Copiar todo el proyecto
COPY . .

# 6️⃣ Construir la app para producción
RUN npm run build

# 7️⃣ Definir puerto para Cloud Run
ENV PORT=8080

# 8️⃣ Exponer el puerto
EXPOSE 8080

# 9️⃣ Comando para arrancar la app
CMD ["npm", "start"]
