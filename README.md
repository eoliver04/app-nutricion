# NutriAI (app-nutricion)

App móvil (Expo + React Native + Expo Router) que fotografía un plato, lo envía
al backend [traking-food](../traking-food) y muestra calorías y macros. Los
análisis y los objetivos del usuario se guardan en el propio dispositivo.

## Puesta en marcha

```bash
npm install
cp .env.example .env     # apunta EXPO_PUBLIC_API_URL a tu backend
npx expo start
```

En un dispositivo físico, `EXPO_PUBLIC_API_URL` debe ser la IP de tu máquina en
la red local (por ejemplo `http://192.168.1.50:3000`), no `localhost`.

## Scripts

```bash
npm run lint        # eslint (expo lint)
npm run typecheck   # tsc --noEmit (requiere haber ejecutado expo start una vez)
npm test            # jest (jest-expo)
```

## Estructura

```
src/
  app/                 # rutas (Expo Router): index, analysis, profile
  components/          # UI reutilizable; nutrition/ para las tarjetas del dominio
  constants/theme.ts   # paleta light/dark; todo color sale de aquí
  features/nutrition/  # api (subida), prepare-image (resize), storage, summary
  features/profile/    # objetivos del usuario (AsyncStorage)
  hooks/               # useAppColors, useColorScheme
```

## Flujo

1. El usuario hace una foto o elige una de la galería (sin recorte forzado).
2. `prepareImage` la reduce a 1600 px y la recodifica a JPEG (85 %), para no
   superar el límite de 5 MB del servidor.
3. `analyzeFood` la sube a `POST /food-analysis` con un timeout de 60 s y
   valida la respuesta.
4. El resultado se guarda con `saveAnalysis` (AsyncStorage) y la foto se copia
   al directorio de documentos.
5. La pantalla de inicio calcula el resumen del día a partir del historial y
   de los objetivos del perfil.
