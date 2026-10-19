# Docker para EESTFlow (SMT)

Esta configuración propone tres caminos:

- `compose.yaml`: desarrollo con el frontend React/Vite, el backend Express y las variables de tus archivos locales. Por defecto el backend usa la conexión `MONGO_URI` que exista en `server/.env` (actualmente MongoDB Atlas).
- `compose.local-db.yaml`: complemento opcional para ejecutar MongoDB localmente y hacer que el backend use ese MongoDB en lugar de Atlas.
- `compose.prod.yaml`: configuración de producción; compila React y sirve `dist` con Nginx, y ejecuta Express con Node.js.

## Dónde copiar cada archivo

Copiá el contenido de la carpeta `client/` de este paquete a `SMT/client/` y el de `server/` a `SMT/server/`. Copiá `compose.yaml`, `compose.local-db.yaml`, `compose.prod.yaml` y `.env.docker.example` a la raíz `SMT/`. No reemplaces los `package.json`, el código fuente ni los archivos `.env` actuales.

Los `.dockerignore` son específicos de cada contexto de build, por eso hay uno en `client/` y otro en `server/`.

## Antes de ejecutar

1. Instalá Docker Desktop y asegurate de que esté iniciado.
2. Abrí una terminal en la raíz `SMT/` y ejecutá `docker compose version`.
3. Verificá que existan `client/package.json`, `server/package.json`, `client/.env` y `server/.env`.
4. Si el frontend y el backend no tienen `package-lock.json`, estos Dockerfiles hacen `npm install` como alternativa. Es recomendable generar y versionar ambos lockfiles para obtener instalaciones reproducibles.
5. Confirmá que el servidor escucha en el puerto `3000` y que la variable `PORT` se utiliza desde el backend.

## Desarrollo usando la base configurada en server/.env

Desde la raíz del proyecto:

```bash
docker compose config
docker compose up --build
```

- Frontend Vite: http://localhost:5173
- Backend Express: http://localhost:3000

Para detener los servicios, usá `Ctrl+C` y después:

```bash
docker compose down
```

Los directorios `client` y `server` se montan como volúmenes para reflejar cambios de código. Los volúmenes `client_node_modules` y `server_node_modules` mantienen las dependencias separadas de las carpetas locales.

## Desarrollo con MongoDB local (opcional)

Ejecutá:

```bash
docker compose -f compose.yaml -f compose.local-db.yaml config
docker compose -f compose.yaml -f compose.local-db.yaml up --build
```

Esta variante sobrescribe `MONGO_URI` dentro del contenedor del backend con `mongodb://mongo:27017/eestflow`; no modifica `server/.env` en tu computadora. MongoDB guarda sus datos en el volumen `mongo_data` y publica el puerto solo en `127.0.0.1` para permitir herramientas locales sin exponerlo a toda la red.

Para detener también MongoDB:

```bash
docker compose -f compose.yaml -f compose.local-db.yaml down
```

No agregues `-v` salvo que quieras borrar los datos guardados en los volúmenes de Docker.

## Preparar producción

1. Copiá `server/.env.production.example` como `server/.env.production` y completá sus valores fuera del repositorio. Usá credenciales nuevas, una URI real de MongoDB y los dominios HTTPS definitivos en `CORS_ORIGIN` y `CLIENT_URL`.
2. Copiá `.env.docker.example` a `.env.docker` en la raíz del proyecto y reemplazá `VITE_API_URL` por la URL pública real de la API. Esta variable se incorpora al bundle de React al ejecutar `vite build`; cambiarla cuando el contenedor ya está iniciado no modifica un bundle ya compilado.
3. Ejecutá:

```bash
docker compose --env-file .env.docker -f compose.prod.yaml config
docker compose --env-file .env.docker -f compose.prod.yaml up --build -d
```

Por defecto, Nginx publica el frontend en el puerto 80 y Express en el 3000. Si el puerto 80 ya está ocupado, cambiá la publicación del frontend en `compose.prod.yaml` de `80:80` a `8080:80` y abrí http://localhost:8080. Si el puerto 3000 está ocupado, cambiá `3000:3000` en ese mismo archivo a `3001:3000`; recordá que la URL pública de API debe coincidir con la configuración externa que uses.

Para detener producción:

```bash
docker compose --env-file .env.docker -f compose.prod.yaml down
```

Esta configuración es una base inicial, no un despliegue completo endurecido para Internet. Para producción real conviene poner HTTPS y un proxy inverso delante, restringir los puertos públicos y usar secretos gestionados por el entorno de despliegue.

## Verificación importante del frontend

El archivo `.env` de Vite no cambia la URL de Axios por sí solo: el código debe leer `import.meta.env.VITE_API_URL`. Revisá `client/src/api.js` y los módulos de API. Elegí una convención consistente:

- Si `VITE_API_URL` termina en `/api`, las rutas de las funciones de API normalmente deben ser relativas a ese prefijo (por ejemplo, `/users`).
- Si las funciones ya solicitan rutas como `/api/users`, la base URL normalmente debe ser el origen (por ejemplo, `http://localhost:3000`) para no duplicar `/api`.

No se ha cambiado ningún archivo fuente de React ni Express porque solo se proporcionaron los `package.json` y una descripción de las carpetas.

## Seguridad

No copies contraseñas, URI completas con credenciales ni secretos JWT al Dockerfile, al archivo Compose o a los argumentos de build. Los archivos `.env` se excluyen del contexto de build y se inyectan en ejecución mediante Compose. Agregá las reglas de `gitignore-docker-additions.txt` al `.gitignore` existente.

Como las credenciales se compartieron en el chat, rotá la contraseña de MongoDB Atlas, los dos secretos JWT y la credencial de correo que corresponda antes de reutilizarlos. No guardes los valores anteriores en esta configuración.
