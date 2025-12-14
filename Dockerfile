# Usamos Node 20 (Next 16 requiere >=20)
FROM node:20

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos package.json y lockfile
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalamos dependencias (puedes usar --frozen-lockfile si usas pnpm)
RUN npm install --production

# Copiamos todo el proyecto
COPY . .

# Usamos el puerto que Cloud Run provee
ENV PORT $PORT

# Exponemos el puerto
EXPOSE $PORT

# Comando para arrancar Next.js
CMD ["npm", "start"]
