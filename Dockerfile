# Usa Node 20 para compatibilidad con Next 16
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto de la app
COPY . .

# Construye la app de Next.js
RUN npm run build

# Configura puerto que Cloud Run provee
ENV PORT $PORT
EXPOSE $PORT

# Comando para iniciar Next.js en producción
CMD ["npm", "start"]
