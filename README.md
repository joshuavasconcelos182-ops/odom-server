# ODO — Sistema de Odometría Diferencial

> Monitor en tiempo real para robots de tracción diferencial. Visualiza la posición, orientación y trayectoria calculada a partir de encoders de rueda.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Cómo funciona](#cómo-funciona)
  - [Modelo matemático](#modelo-matemático)
  - [Comunicación cliente-servidor](#comunicación-cliente-servidor)
- [Estructura de archivos](#estructura-de-archivos)
- [Instalación y uso](#instalación-y-uso)
- [Interfaz de usuario](#interfaz-de-usuario)
- [API REST de los servidores](#api-rest-de-los-servidores)
- [Tecnologías utilizadas](#tecnologías-utilizadas)

---

## Descripción general

**ODO** es un sistema de monitoreo de odometría diferencial compuesto por:

- **Dos servidores Node.js** que simulan encoders de rueda (izquierda y derecha), exponiendo una API REST para leer y manipular los conteos de ticks.
- **Un cliente web** (`index.html` + `app.js`) que consulta ambos servidores en tiempo real, calcula la posición y orientación del robot, y los visualiza en un dashboard HUD.

El sistema permite tanto la simulación automática del movimiento del robot como la reproducción paso a paso de una sesión grabada.

---

## Arquitectura del proyecto

```
┌─────────────────────────────────────────────┐
│                  Navegador                  │
│                                             │
│   index.html ──► app.js ──► Chart.js        │
│       │              │                      │
│       └──── HUD ─────┘                      │
│             Canvas (trayectoria)            │
│             Gráficas de velocidad           │
└──────────┬──────────────────┬───────────────┘
           │  HTTP polling    │  HTTP polling
           ▼                  ▼
   ┌───────────────┐  ┌───────────────┐
   │ server-left   │  │ server-right  │
   │  (puerto 3000)│  │  (puerto 3001)│
   │  Rueda Izq.   │  │  Rueda Der.   │
   └───────────────┘  └───────────────┘
```

El cliente hace polling periódico a `GET /ticks` en ambos servidores para obtener los conteos actuales, calcula la odometría diferencial y actualiza el dashboard.

---

## Cómo funciona

### Modelo matemático

La odometría diferencial calcula la posición global `(x, y)` y la orientación `θ` del robot usando los deltas de distancia de cada rueda entre dos muestras consecutivas.

Dado un diámetro de rueda `D` y una separación entre ruedas `L`:

```
distancia por tick = π × D / resolución_encoder

ΔdL = ticksL_nuevo - ticksL_anterior  →  distL
ΔdR = ticksR_nuevo - ticksR_anterior  →  distR

distancia_centro = (distL + distR) / 2
Δθ = (distR - distL) / L

x_nueva = x + distancia_centro × cos(θ + Δθ/2)
y_nueva = y + distancia_centro × sin(θ + Δθ/2)
θ_nueva = θ + Δθ
```

Cada muestra se almacena en un historial de frames que permite la reproducción hacia adelante y hacia atrás.

### Comunicación cliente-servidor

El cliente web usa `fetch` nativo para consultar los servidores:

```js
// Ejemplo de lectura de ticks
const res = await fetch('http://localhost:3000/ticks');
const { ticks } = await res.json();
```

El polling se ejecuta con `setInterval` cada cierto intervalo configurable. Cuando ambos servidores responden, se ejecuta el cálculo de odometría y se actualiza la UI.

---

## Estructura de archivos

```
.
├── index.html        # Estructura HTML del dashboard
├── styles.css        # Estilos del HUD y componentes visuales
├── app.js            # Lógica principal: odometría, gráficas, canvas, log
├── server-left.js    # Servidor Express – encoder rueda izquierda (3000)
├── server-right.js   # Servidor Express – encoder rueda derecha (3001)
└── package.json      # Dependencias Node.js (express, cors)
```

---

## Instalación y uso

### Requisitos previos

- [Node.js](https://nodejs.org/) v16 o superior
- npm

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar los servidores de encoders

Abre **dos terminales** y ejecuta uno en cada una:

```bash
# Terminal 1 — Rueda izquierda
npm run left
# 🔵 Rueda IZQUIERDA en http://localhost:3000

# Terminal 2 — Rueda derecha
npm run right
# 🟠 Rueda DERECHA en http://localhost:3001
```

Cada servidor comienza a incrementar sus ticks automáticamente con una probabilidad del 60 % cada 500 ms, simulando el movimiento de una rueda.

### 3. Abrir el dashboard

Abre `index.html` directamente en el navegador (doble clic) o sírvelo con cualquier servidor estático:

```bash
npx serve .
```

Navega a `http://localhost:3000` (o el puerto que indique `serve`).

> **Nota:** Si abres el archivo directamente desde el sistema de archivos (`file://`), asegúrate de que tu navegador no bloquee las peticiones a `localhost`. Chrome y Firefox lo permiten por defecto.

---

## Interfaz de usuario

| Zona | Descripción |
|---|---|
| **HUD superior** | Muestra la orientación angular `θ` y la posición global `(x, y)` en tiempo real |
| **Encoder cards** | Estado de conexión, ticks acumulados y distancia recorrida por cada rueda |
| **Canvas de trayectoria** | Dibuja el recorrido del robot. Modos: *Seguir* (cámara sigue al robot) / *Libre* (pan y zoom manual) |
| **Controles** | Play / Pause / Stop, reproducción fotograma a fotograma (◀◀ / ▶▶), reset de posición o total |
| **Stats** | Velocidad instantánea izquierda/derecha, posición X e Y |
| **Gráficas** | Velocidad en m/s y diferencia de ticks en el tiempo (Chart.js) |
| **Ejes de referencia** | Coordenadas globales, locales y por rueda |
| **Log** | Registro filtrable de eventos (TICK, ODO, SPD, WARN) con opción de exportar |

### Filtros de log

Haz clic en las pastillas de colores para activar/desactivar categorías:

- `TICK` — Cambios de conteo en encoders
- `ODO`  — Actualizaciones de posición calculada
- `SPD`  — Cambios de velocidad
- `WARN` — Avisos (pérdida de conexión, valores anómalos)

---

## API REST de los servidores

Ambos servidores (`server-left.js` en :3000 y `server-right.js` en :3001) exponen los mismos endpoints:

### `GET /ticks`

Devuelve el conteo actual de ticks.

```json
{ "ticks": 42 }
```

### `POST /tick`

Incrementa el contador en 1 (útil para pruebas manuales).

```json
{ "ticks": 43 }
```

### `POST /reset`

Establece el contador a un valor específico (por defecto `0`).

**Body:**
```json
{ "value": 0 }
```

**Respuesta:**
```json
{ "ticks": 0 }
```

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| **Node.js + Express** | Servidores de encoders con API REST |
| **cors** | Habilita peticiones cross-origin desde el cliente web |
| **HTML5 Canvas** | Renderizado de la trayectoria del robot |
| **Chart.js** | Gráficas de velocidad y diferencia de ticks |
| **CSS Variables** | Theming del HUD (colores L/R, fondos, tipografía) |
| **Barlow / JetBrains Mono** | Tipografías del dashboard vía Google Fonts |
| **Fetch API** | Polling HTTP nativo sin dependencias adicionales en el cliente |
