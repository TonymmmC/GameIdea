# Herramientas de prueba (no forman parte del juego)
Requiere Node 18+. Para las de navegador: `npm i puppeteer-core` y Chrome instalado.
- `node validate.js` — revisa la estructura de todos los mapas.
- `node solver.js 1-4` — el bot intenta terminar el piso con la física real (lento: 3–10 min por piso). Puntos de ruta en `waypoints.js`.
- `./runall.sh 1-2 1-5 ...` — varios pisos en paralelo (resultados en `logs/`).
- `smoke.js`, `bosstest.js`, `uitest.js` — capturas y pruebas en Chrome (servir antes `no-name/` en http://localhost:8765).
