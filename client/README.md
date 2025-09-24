# GrocerEase Client (PWA)

Scripts
- npm run dev: start Vite dev server
- npm run build: type-check and production build
- npm run preview: preview production build

Env modes
- VITE_API_MODE=sim (default): in-memory simulator with latency
- VITE_API_MODE=mock: static mock data
- VITE_API_MODE=http: real HTTP API using VITE_API_BASE (e.g. http://localhost:5100)

Path aliases
- This project expects the Vite alias `@ -> ./src`.
- If the dev server fails to resolve imports like `@/pages/Home`, add the alias in `vite.config.ts`:
  - resolve.alias = { '@': path.resolve(__dirname, './src') }
  - and import path: `import path from 'node:path'`

Pages
- Home: view/create lists
- List Editor: add and complete items

DI and services
- tsyringe container registers ListsService implementation based on VITE_API_MODE.
- Implementations: MockListsService, SimulatedListsService, HttpListsService.

PWA
- vite-plugin-pwa auto updates SW. Add real icons at public/icons/ for install banners.

Getting started
1. cd client
2. npm install
3. Ensure alias is configured (see Path aliases above)
4. npm run dev
