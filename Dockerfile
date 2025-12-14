# Usa la imagen oficial de Node.js
FROM node:18

# Crea el directorio de la app
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto del código
COPY . .

# Expone el puerto que Cloud Run asignará
ENV PORT $PORT
EXPOSE $PORT

# Comando para iniciar la app
CMD ["node", "index.js"]
