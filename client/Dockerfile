# Imagen base para desarrollo y para construir el frontend de producción.
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .

# Desarrollo local: Vite escucha en todas las interfaces del contenedor.
FROM dependencies AS development
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Compilación del frontend. Vite inserta VITE_API_URL en los archivos compilados.
FROM dependencies AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Producción: Nginx sirve los archivos estáticos generados por Vite.
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
