# SUVICA - Captura Rápida de Inventario con IA (PWA)

Aplicación web progresiva (PWA) móvil-primero construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM (PostgreSQL)** y **Google Gemini 2.5 Flash** (`@google/genai`) para la recolección rápida de inventario de equipos (**Laptops, Celulares y Radios**) mediante fotografía.

## Características Principales

1. **Base de Datos Relacional (PostgreSQL + Prisma)**:
   - `Trabajador`: `id`, `empresa`, `departamento`, `cedula` (única), `nombre`, `cargo`.
   - `Dispositivo`: `id`, `codigoInventario`, `tipoEquipo` (`Laptop`, `Celular`, `Radio`, `Otro`), `marcaModelo`, `macAddress`, `imei1`, `imei2`, `trabajadorId`, `createdAt`.
   - Incluye script de carga inicial en `prisma/seed.ts`.
2. **Visión con IA (`/api/analizar-foto`)**:
   - Usa el SDK oficial `@google/genai` con el modelo `gemini-2.5-flash` y `responseSchema` estricto en JSON.
   - Normaliza automáticamente direcciones MAC (`XX:XX:XX:XX:XX:XX`) y códigos IMEI de 15 dígitos.
3. **Compresión de Imagen en el Cliente**:
   - Abre directamente la cámara trasera del teléfono (`capture="environment"`) y redimensiona la imagen en el navegador a **máx. 1200px (JPEG calidad 0.8)** antes de enviarla al servidor.
4. **Exportación de Reportes (`/api/dispositivos`)**:
   - Consulta en tiempo real y descarga directa en **CSV** y **Excel CSV (con BOM UTF-8)** desde `/registros`.
5. **Lista para EasyPanel (Docker)**:
   - Configurada con `output: "standalone"` en `next.config.ts` y `Dockerfile` multi-etapa en `node:20-alpine`.

---

## Instalación y Uso Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   Copia `.env.example` a `.env` y configura tu cadena de conexión PostgreSQL y tu clave de API de Gemini:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/suvica_inventario?schema=public"
   GEMINI_API_KEY="AIzaSy..."
   ```

3. **Sincronizar esquema Prisma y poblar trabajadores iniciales**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

---

## Despliegue en EasyPanel

1. **Crear el servicio de Base de Datos**:
   - En tu proyecto de EasyPanel (ej. `kickoff`), selecciona **Postgres**.
   - Copia la URL de conexión interna (`postgres://...`).
2. **Crear el servicio de Aplicación**:
   - Haz clic en **+ Servicio** → **Aplicación**.
   - Conecta tu repositorio de GitHub y selecciona **Dockerfile** como método de compilación.
   - En **Variables de Entorno (Environment)** agrega:
     - `DATABASE_URL`: La URL interna de tu servicio Postgres.
     - `GEMINI_API_KEY`: Tu API Key de Google AI Studio.
   - Verifica que el puerto interno sea `3000` y presiona **Deploy**.
3. **Inicializar tablas**:
   - Desde la consola del contenedor en EasyPanel (o conectándote a la base de datos), ejecuta:
     ```bash
     npx prisma db push
     ```

