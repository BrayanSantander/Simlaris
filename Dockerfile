# Usa Node.js 20 como base (Next 16 requiere >= Node 20)
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias primero
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto del proyecto
COPY . .

# Construye la app de Next.js
RUN npm run build

# Puerto que Cloud Run asigna
ENV PORT $PORT
EXPOSE $PORT

# Comando para iniciar Next.js
CMD ["npm", "start"]
