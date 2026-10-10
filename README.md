# Secanuca

Secanuca muestra resultados de fútbol en vivo, información de partidos y equipos, posiciones e historial de partidos por árbitro.

## Requisitos

- Node.js 20 o posterior.
- Una instancia de Redis accesible desde la aplicación y el sincronizador.
- La variable de entorno `REDIS_URL`.

## Ejecutar localmente

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un archivo `.env.local` con la conexión a Redis:

   ```env
   REDIS_URL=redis://...
   ```

3. Iniciar la aplicación:

   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000).

## Sincronización de datos

El workflow de GitHub Actions está en `.github/workflows/sync.yml` y necesita que el secreto `REDIS_URL` esté configurado en el repositorio.

El sincronizador `sync-promiedos.js` escribe los datos que consume la aplicación. Las claves Redis actuales usan el prefijo `chiquifutbol_` por compatibilidad con los datos existentes; no cambiar ese prefijo sin actualizar conjuntamente el sincronizador y las rutas de API.

## Despliegue

La aplicación web puede desplegarse en Vercel. Configurá `REDIS_URL` como variable de entorno del proyecto para que las rutas de API puedan leer los datos sincronizados.
