# MetalTech Dashboard (Frameworks Front-end)

Dashboard em **React + Vite** (Bootstrap 5 / React-Bootstrap) para a esteira de triagem: mostra os 3 sensores
(indutivo, capacitivo e distância), a contagem de peças metálicas e não metálicas e o histórico de leituras.

## Como rodar
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```
Por padrão usa **dados simulados** (`VITE_USE_MOCK=true`). Para a API real: `VITE_USE_MOCK=false` e `VITE_API_URL=http://localhost:8080`.

## Contrato da API (combinar com o Back-end)
`GET /api/esteira/status`
```json
{ "nome": "Esteira de triagem", "operando": true, "ultimaLeitura": "2026-11-10T14:30:00Z",
  "totalMetalicas": 120, "totalNaoMetalicas": 74 }
```
`GET /api/leituras?limite=100` (da mais antiga para a mais recente)
```json
[ { "id": 1, "timestamp": "2026-11-10T14:29:30Z", "indutivo": "0x0001", "capacitivo": "0x0001", "distancia": "0x00A3" } ]
```
- Os sensores podem vir em **hexadecimal** (`"0x00A3"` ou `"00A3"`) ou já como número; o front converte (`src/utils/sensors.js`).
- Classificação da peça: indutivo > 0 = **metálica**; só capacitivo > 0 = **não metálica**. Se o back mandar `tipoPeca` (`METALICA`/`NAO_METALICA`), ele tem prioridade.
- Se `totalMetalicas`/`totalNaoMetalicas` não vierem no status, o front conta pelas leituras recebidas.
- O Spring Boot precisa liberar CORS para `http://localhost:5173`.

## Estrutura
```
src/components  NavBar, SensorCard, KpiCard, Charts, Panel, DataGate, StatusPill, PageHeader
src/pages       Dashboard, Leituras, Configuracoes, NotFound
src/context     SettingsContext (tema, API), DataContext (polling)
src/services    api.js (REST), mockApi.js (simulação)
src/utils       sensors.js (hex e classificação), format.js
```
