FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .

# Desarrollo local: usa el script "dev" que ya existe en package.json.
FROM dependencies AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Producción: instala solo dependencias de producción y ejecuta el archivo de entrada.
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
