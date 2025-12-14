# Usa Node.js 18 como base
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm install --production

# Copia el resto de los archivos de la app
COPY . .

# Exponer el puerto que Cloud Run asignará
ENV PORT $PORT
EXPOSE $PORT

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
