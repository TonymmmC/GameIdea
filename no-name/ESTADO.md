# Estado del proyecto — 24/09/2026

## Lo que pidieron los amigos → qué se hizo
| Pedido | Hecho |
|---|---|
| Más niveles, más largos y creativos, con puzles | 20 pisos nuevos desde cero (120–200 casillas de ancho, o torres verticales de 44–60 filas), más 4 arenas de jefe. Cada reino: 5 pisos → mini-jefe → 5 pisos → jefe final. |
| Solo dificultad difícil | Dificultad única, fija (la antigua «Difícil»). Un golpe = apagón. Braseros (checkpoints) en pisos largos. |
| Jefes más difíciles y originales | 4 jefes con 3 fases cada uno; en cada fase recibes un escudo de brasa (aguanta 1 golpe); si mueres, el jefe empieza de cero. |
| Explotar las mecánicas | Mecánicas nuevas: velas + bloques fantasma, calor/frío (respiraderos, ventiscas, escarcha que se derrite, hielo fino, tablas que arden, lava que se congela), 2 enemigos nuevos (gárgola, saltarín). Se mantienen y combinan las antiguas (llaves, palancas, bloques rojo/azul, portales, cintas, cañones, impulso…). |
| Menú más intuitivo, que no parezca IA | Menú de texto con cursor de llama sobre una escena viva: la torre del fondo enciende una ventana por cada piso que superas. Se navega igual con teclado, mando y táctil. |
| Ranking de speedrun gratis y accesible desde el juego | Supabase (gratis). Categorías: torre completa, por reino, desfile de jefes y por piso. Validación básica anti-trampas en el servidor. |
| Premios por ser el mejor | El nº 1 de la torre completa gana la llama «Corona de ascuas», la «Corona real» y el título «Leyenda de la torre». El top 3 de cualquier tabla gana estelas de oro/plata/bronce. El nombre del campeón aparece en el menú y en una placa en el piso I-1. Se pierden si te quitan el puesto. |
| Tienda y logros | Tienda con brasas (llamas, estelas, sombreros, efectos de apagón) y 26 logros, algunos con título. |
| Cuentas para guardar progreso | Nombre + PIN, progreso en la nube (se combina con el local). PIN cifrado con bcrypt y bloqueo tras 5 intentos fallidos. |
| Buzón de feedback | Dentro del juego; los mensajes llegan a la tabla `nn_feedback` de Supabase (y se encolan si no hay conexión). |
| PC, mando y Android | Teclado, mando (Gamepad API) y controles táctiles. PWA instalable en Android y funciona sin conexión. |
| Resetear el progreso de todos | Guardado nuevo (`noname-save-v1`). El guardado de Torre de Ascua se borra al abrir el juego. |
| Nombre | «NO NAME» provisional; se cambia en `js/config.js`. |

## Los 4 jefes
- **El Campanero** (I-6): lanza ondas de campana por el suelo y hace caer escombros. Cuando se marea, enciendes una vela para crear una escalera fantasma y le saltas encima. En la fase 2 el suelo se llena de púas; en la fase 3 apaga la luz, dispara notas y se lanza en picada.
- **Madre Cirio** (I-12): una vela gigante que llora cera, y la cera se endurece en bloques que puedes escalar para pisar su llama. En la fase 2 hay una marea de cera; en la fase 3 queda solo su pabilo, que salta en la oscuridad y deja fuego.
- **El Témpano** (II-6): una persecución. Un muro de hielo te sigue y tienes que llegar CALIENTE a 3 hornos para quemarlo.
- **La Bicéfala** (II-12): la cabeza de fuego solo se daña estando FRÍO y la de hielo estando CALIENTE. En la fase 2 el suelo se vuelve lava; en la fase 3 las cabezas se fusionan, cambian de elemento y disparan espirales.

## Pruebas realizadas
- **Estructura de mapas:** los 24 niveles pasan el validador (filas y anchos correctos, un inicio y un farol por nivel, igual número de llaves que de rejas, portales en pares).
- **Navegador (Chrome headless):** carga sin errores de JavaScript. Menú, torre, tienda (compra y equipamiento), pausa, pantalla de victoria, logros, buzón sin conexión y vista móvil funcionan.
- **Jefes:** los 4 recorren sus 3 fases, mueren y abren el farol, sin errores.
- **SQL:** probado en un PostgreSQL local. Registro, login, nombre duplicado, bloqueo tras 5 fallos, ranking que conserva la mejor marca, rechazo de tiempos y categorías imposibles, guardado y buzón funcionan. Las tablas no son accesibles directamente. El script se puede ejecutar varias veces sin romper nada.
- **Bot que juega los niveles con la física real** (en `tools/`, fuera del juego). Busca una ruta hasta el farol:
  - **Resueltos:** 1-1, 1-3, 1-4, 1-7, 1-8, 1-9, 2-1 (antes de añadir el enfriamiento del impulso) y 2-2, 2-3 (después de añadirlo).
  - **Estaban en curso al cerrar la sesión:** 1-2, 1-5, 1-10, 2-4, 2-5, 2-7, que avanzaban por sus puntos de ruta.
  - **Sin verificar:** 1-11 (el bot se atascó cerca de la chimenea de la fila 35; puede ser un límite del bot o un salto demasiado justo), 2-8, 2-9, 2-10 y 2-11.

## PENDIENTE (en orden de prioridad)
1. **Verificar con el bot** los niveles no confirmados, sobre todo 1-11, y volver a pasar los que se resolvieron antes del enfriamiento del impulso. Si alguno falla, ajustar el salto concreto (subir o bajar una plataforma una casilla).
2. **Probar los jefes jugando de verdad** para ajustar la dificultad: velocidades, vida y ventanas de golpe. Están en `js/bosses.js` (`phases:[{hp:…}]` y los tiempos de cada estado).
3. **Configurar Supabase** y poner la URL y la clave en `js/config.js` (guía en LEEME.md). Sin esto, ranking, cuentas y buzón funcionan solo en local.
4. **Publicar en GitHub Pages** (guía en LEEME.md).
5. **Créditos:** poner los nombres reales en `js/config.js`.
6. **Fase 2:** reinos III (Marea Negra: agua y oxígeno), IV (Observatorio Invertido: gravedad), V (El Compás: plataformas al ritmo de la música) y VI (Reloj de Arena: rebobinar, más un jefe final «trampa»). Ya aparecen como «próximamente» en la torre. Faltan también los modos extra (Torre Invertida, reto diario y carrera contra el fantasma del nº 1).

## Estructura
```
no-name/            ← el juego (esto es lo que se publica)
  index.html        estilos y pantallas
  js/config.js      nombre, versión, Supabase, créditos
  js/meta.js        guardado, tienda, logros
  js/audio.js       sonido y música sintetizados
  js/engine.js      física y mecánicas
  js/render.js      dibujo
  js/bosses.js      los 4 jefes
  js/levels.js      los 24 niveles (mapas en texto)
  js/net.js         Supabase (ranking, cuentas, buzón)
  js/ui.js          menús, modos, entrada, bucle principal
  supabase/schema.sql
  sw.js, manifest.webmanifest, icons/   (PWA)
tools/              bot verificador y validador (no se publican)
history/            versión anterior (Torre de Ascua)
```
