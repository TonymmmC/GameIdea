# NO NAME — Fase 1

Plataformas difícil en pixel art. Una sola vida por golpe, jefes con fases, 24 pisos (2 reinos) en esta fase.

## Jugar en tu PC
Abre `index.html` con doble clic, o mejor con un servidor local (necesario para que funcione como app):
```
cd no-name
python -m http.server 8000
```
y entra a http://localhost:8000

## Controles
| | Teclado | Mando | Celular |
|---|---|---|---|
| Mover | ← → / A D | stick / cruceta | ◀ ▶ |
| Saltar | ESPACIO / Z / ↑ | A | ▲ |
| Impulso | SHIFT / X | B / X / RB | ⚡ |
| Pausa | ESC / P | START | II |
| Reiniciar piso | R | SELECT | (menú de pausa) |

---

## 1) Ranking, cuentas y buzón en línea (Supabase, gratis) — 5 minutos
Solo lo haces TÚ una vez. Tus amigos no necesitan nada.

1. Entra a https://supabase.com → **Start your project** → inicia sesión con GitHub o correo.
2. **New project**: ponle un nombre (ej. `noname`), una contraseña cualquiera (guárdala), región **South America (São Paulo)** o la más cercana. Plan **Free**. Espera ~1 minuto.
3. Menú izquierdo → **SQL Editor** → **New query** → pega TODO el contenido de `supabase/schema.sql` → **Run**. Debe decir *Success*.
4. Menú izquierdo → **Project Settings** (engranaje) → **API** (o *Data API*). Copia:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public** key (una clave larga que empieza por `eyJ...`, o `sb_publishable_...`)
5. Abre `js/config.js` y pégalas:
   ```js
   const SUPABASE_URL='https://abcdxyz.supabase.co';
   const SUPABASE_KEY='eyJ....';
   ```
   La clave *anon* es pública a propósito: la base de datos solo permite usar las funciones del juego (nadie puede borrar ni editar tablas).

**Leer el buzón de tus amigos:** Supabase → *Table Editor* → `nn_feedback`. O en SQL Editor: `select * from nn_feedback order by created_at desc;`

> El plan gratis de Supabase pausa el proyecto si pasa 7 días sin uso. Si pasa, entra a supabase.com y pulsa *Restore*. Tus datos siguen ahí.

## 2) Publicarlo gratis en internet (GitHub Pages)
1. Crea una cuenta en https://github.com (si no tienes).
2. **New repository** → nombre `noname` → Public → *Create repository*.
3. En la página del repo: **Add file → Upload files** → arrastra **todo el contenido de la carpeta `no-name`** (index.html, js/, icons/, supabase/, manifest.webmanifest, sw.js, LEEME.md) → *Commit changes*.
4. **Settings → Pages** → *Source: Deploy from a branch* → Branch `main`, carpeta `/ (root)` → **Save**.
5. En 1–2 minutos tu juego estará en `https://TU-USUARIO.github.io/noname/`. Ese es el enlace para tus amigos.

**Actualizar:** sube los archivos cambiados otra vez (Add file → Upload files). Si cambias archivos, sube también el número de versión en `sw.js` (`const V='noname-f1-2'`) para que los celulares descarguen lo nuevo.

## 3) Instalar como app en Android
Abre el enlace en **Chrome** → menú ⋮ → **Instalar app** (o *Agregar a pantalla de inicio*). Queda con icono, en pantalla completa y funciona sin internet (el ranking necesita conexión).

## Cosas que puedes editar fácilmente
- **Nombre del juego:** `js/config.js` → `GAME_NAME`.
- **Créditos:** `js/config.js` → `CREDITS`.
- **Rankings nuevos** (si cambias niveles y quieres empezar de cero): `js/config.js` → `RANK_VER` (ej. `'f2'`).
- **Niveles:** `js/levels.js` (el mapa está dibujado con caracteres; la leyenda está arriba del archivo).

## Progreso
Esta versión usa un guardado nuevo: todos empiezan de cero (el progreso de *Torre de Ascua* se borra al abrir el juego). La versión anterior (Torre de Ascua) está en la carpeta `history/`, fuera de `no-name/`.
