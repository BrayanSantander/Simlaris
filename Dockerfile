# Dockerfile para Next.js + Cloud Run

# 1️⃣ Imagen base oficial de Node.js LTS
FROM node:20-alpine

# 2️⃣ Crear directorio de la app
WORKDIR /app

# 3️⃣ Copiar package.json y pnpm-lock.yaml (o package-lock.json)
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 4️⃣ Instalar dependencias
RUN npm install --production

# 5️⃣ Copiar el resto del proyecto
COPY . .

# 6️⃣ Construir la app para producción
RUN npm run build

# 7️⃣ Definir variable de puerto (Cloud Run pasa PORT automáticamente)
ENV PORT $PORT

# 8️⃣ Exponer el puerto
EXPOSE $PORT

# 9️⃣ Comando para arrancar la app en producción
CMD ["npm", "start"]
