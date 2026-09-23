# Torre de Ascua

Juego de plataformas 2D en español, pixel art, **en un único archivo HTML sin dependencias**.

> Eres Ascua, la última brasa del mundo. Trepa la torre, enciende sus faroles,
> derrota a sus guardianes y no dejes que la noche (ni tu propia sombra) te apague.

**Estado actual (v3.0):** 53 pisos · 10 reinos · 3 jefes · 3 dificultades.

## Archivos

| Archivo | Qué es |
|---|---|
| `torre-de-ascua.html` | El juego completo. Único archivo del juego. |

(Existía una copia `torre-de-ascua-compartir.html`; se eliminó el 2026-09-23.)

Estructura interna: `<style>` (líneas ~10-100) · marcado (~105-200) · `<script>` (~203-1560).
Todo el juego vive dentro de un IIFE en `'use strict'`.

---

## Lo más importante: NO hay assets

Esta es la propiedad central del proyecto y conviene no romperla.

- **Cero imágenes.** No hay sprites ni spritesheets. Todo se dibuja en tiempo real
  con Canvas 2D — 166 `ctx.fillRect` y algunos paths. Personajes, enemigos, jefes,
  tiles y fondos son código.
- **Cero archivos de sonido.** Todo el audio se sintetiza en vivo con Web Audio API
  (osciladores + ruido blanco). La música es una progresión i–VI–VII–v generada al
  vuelo, transpuesta a la nota raíz (`root`) de cada reino, al tempo de su `bpm`.
- **Cero librerías.** No hay frameworks, ni bundler, ni build. Se abre en el navegador.
- **Animaciones por matemática, no por frames.** El murciélago flota con
  `y0 + Math.sin(t*2.6)*8`; el squash-and-stretch al aterrizar sale de la velocidad
  de impacto.

Único recurso externo: dos fuentes de Google Fonts (*Pixelify Sans*, *VT323*),
ambas con licencia SIL Open Font License. Sin conexión el juego funciona igual,
solo cae a las fuentes de reserva.

**Consecuencia práctica:** se puede añadir todo el contenido que se quiera sin
buscar, licenciar ni pagar assets a terceros.

---

## Cómo añadir contenido

### Nivel nuevo en un reino existente — dato puro, sin código

Es el camino barato y sin riesgo. Un nivel entero es un objeto:

```js
{n:'Púas', z:0, w:50, h:14, hint:'Las púas apagan tu llama al instante',
 b:({f,r,s})=>{ f(0,11,42,3); s(1,10,'P'); r(10,10,'^^'); s(47,10,'E'); }}
```

- `f(x,y,w,h,c)` — rectángulo de tiles (por defecto `#`)
- `r(x,y,"cadena")` — fila de tiles como texto
- `s(x,y,c)` — un tile suelto
- `z` — índice del reino en `ZONES` · `w`/`h` — tamaño en tiles (1 tile = 16 px)

Campos opcionales: `hint` (texto de ayuda), `dark:1` (solo te ilumina tu llama),
`rise:N` (lava que sube), `chase:N` (tu sombra te persigue), `boss:'king'|'forge'|'shadow'`.

Con el alfabeto que ya existe se pueden hacer decenas de niveles **sin escribir
lógica nueva**.

### Alfabeto de tiles

| | | | |
|---|---|---|---|
| `#` sólido | `I` hielo (resbala, no se escala) | `=` plataforma atravesable | `C` suelo frágil |
| `(` `)` cintas transportadoras | `w` corriente de aire | `M` plataforma móvil ↔ | `N` plataforma móvil ↕ |
| `^` púas ↑ | `v` púas ↓ | `{` `}` púas laterales | `~` lava |
| `T` llamarada | `<` `>` cañón | `R` `B` bloques que alternan al saltar | `Q` muro rompible (impulso) |
| `D` reja (gasta llave) | `K` llave | `L` palanca | `Z` `Y` compuertas de palanca |
| `H` pasadizo secreto | `+` hongo luminoso | `1`-`4` portales emparejados | `\|` marca de giro (IA) |
| `P` inicio | `E` salida/farol | `*` chispa dorada | `F` brasero (checkpoint) |
| `S` resorte | `o` orbe (salto extra) | `e` sombra | `b` murciélago |
| `a` alas | `d` impulso | `h` escudo | `t` reloj (ralentiza) |
| `X` aparición del jefe | | | |

### Reino nuevo — mitad dato, mitad código

La paleta es dato (un objeto en `ZONES` con ~14 colores, `seed`, `root`, `bpm`).
Pero el campo `kind` ramifica en tres sitios que sí piden código nuevo:

- `zoneArt()` — cielo y capas de fondo
- el horneado de tiles — detalles por reino
- `ambient()` — partículas de ambiente

Si el reino nuevo reutiliza un `kind` existente, sale gratis.

### Jefe nuevo — código

`BOSS_DEF` + una rama en `updBoss()` (máquina de estados) + otra en `drawBoss()`.
Los tres actuales rondan las 30 líneas cada uno.

### Efecto de sonido nuevo — una línea

```js
case 'miNuevoSfx': tone(440,.1,'square',.06,880); break;   // en sfx()
```

---

## Dos trampas al añadir niveles

### 1. Los jefes están insertados por índice fijo

```js
LEVELS.splice(15,0,{ ...Rey Hollín });
LEVELS.splice(31,0,{ ...La Forjadora });
```

Si insertas niveles **antes** de esos índices, los jefes acaban en el piso
equivocado. Falla en silencio: nada revienta, solo queda mal colocado.

### 2. Insertar en medio rompe las partidas guardadas

El progreso se guarda en `localStorage` bajo `torre-ascua-v1`, indexado **por
número de piso**. Meter niveles en medio desplaza todos los índices posteriores y
descoloca récords y chispas de quien ya estaba jugando.

Ya ha pasado dos veces; las migraciones están al final del script:

```js
if(!save.v){    const mp = i => i<15 ? i : i+1;  /* ... */ save.v=2; }  // entró el 1er jefe
if(save.v===2){ const mp = i => i<47 ? i : i+5;  /* ... */ save.v=3; }  // entró la Biblioteca
```

**Regla práctica: añadir contenido al final con `LEVELS.push(...)`**, como se hizo
con el reino de la Biblioteca. Cero migraciones, cero índices rotos. Si por narrativa
hace falta meterlo en medio, hay que escribir una migración nueva — que sea decisión
consciente, no sorpresa.

---

## Sistemas

- **Movimiento:** paso fijo a 120 Hz (`STEP=1/120`) con acumulador. Coyote time y
  buffer de salto, ambos ajustados por dificultad. Salto de pared, impulso (dash),
  salto extra con alas/orbes, salto cortado al soltar el botón.
- **Dificultades** (`DIFFS`): `normal`, `dificil`, `pesadilla`. Multiplican enemigos,
  peligros, lava, vida de jefes, ventana de coyote… `pesadilla` desactiva los braseros.
  **Por defecto arranca en `dificil`.**
- **Récords** por dificultad (`save.bestD[diff]`), independientes entre sí.
- **Chispas doradas** (`*`), una por piso, desbloquean 7 llamas (skins) por umbrales.
- **Accesibilidad:** respeta `prefers-reduced-motion` (desactiva el temblor de pantalla);
  a las 20 muertes en un piso se ofrece saltárselo desde la pausa.
- **Controles:** teclado (`←→`/`AD`, `espacio`/`W`/`↑`, `shift`/`X`, `R`, `ESC`) y
  táctil (aparece solo en punteros gruesos).

## Convenciones de estilo

El código es **denso a propósito**: sentencias encadenadas con `;` en una línea,
nombres muy cortos (`L` nivel, `P` jugador, `Z` zona, `B` jefe), comentarios escasos
y en español. Mantener ese estilo al editar — no "limpiarlo" en estilo convencional.

---

## Historia

Nació de dos prompts —*"haz un juego de plataformas en HTML divertido, sé creativo"*
y después *"más niveles"*— y creció con **playtesting real**: el autor y sus amigos
lo jugaron y reportaron que era demasiado fácil y que no tenía jefes. De ese feedback
salieron los 3 jefes, las 3 dificultades, el arranque en `dificil` y la opción de
saltar piso tras 20 muertes.

El código lo escribió Claude; la dirección y el playtesting son del autor.
Si hay que declarar autoría: **desarrollado con asistencia de IA**, y los únicos
recursos de terceros son las dos fuentes OFL de Google Fonts.

## Cambios recientes (2026-09-22)

- **Reparado `torre-de-ascua.html`**, que no era un documento HTML válido: le
  faltaban `<!DOCTYPE>`, `<html>`, `<head>`, `<meta charset>`, `<meta viewport>` y
  `<body>` — empezaba directo en `<title>`. Provocaba modo quirks, acentos rotos
  (`Difícil` → `DifÃ­cil`) y escala minúscula en móvil. Reconstruido desde la copia
  `-compartir`, que sí estaba completa.
- **Metadatos de `<head>`** en el HTML: `description`, Open Graph y Twitter
  Card (para que el enlace se previsualice bien al compartirlo), `theme-color`,
  metas de web-app para iOS/Android, y favicon de llama en SVG inline.
- **`flipT` inicializado a `0`** en el objeto de nivel; antes `if(L.flipT>0)` leía
  `undefined` en el primer frame.
- **`fit()` también escucha `orientationchange` y `visualViewport.resize`**, que es
  lo que dispara iOS al mostrar/ocultar la barra de direcciones.
- **`#hint` ahora es `role="status" aria-live="polite"`**, para que los avisos del
  juego se anuncien en lector de pantalla.

## Ideas pendientes

- Mecánicas aún sin usar: agua/natación, gravedad invertida, bloques empujables.
- Reino nuevo de 5 niveles añadido **al final** (camino sin riesgo).
- Embeber las dos fuentes en base64 si se quiere funcionamiento 100 % offline
  idéntico (subiría el archivo de ~120 KB a un par de cientos).
