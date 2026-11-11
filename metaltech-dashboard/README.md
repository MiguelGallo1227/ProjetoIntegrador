# MetalTech Dashboard (Frameworks Front-end)

Dashboard web em **React + Vite** para monitorar a esteira de triagem: contagem de peças metálicas/não metálicas,
nível do reservatório, análises estatísticas e alertas. Estilização com **Bootstrap 5 / React-Bootstrap**.

## Como rodar
```bash
npm install
cp .env.example .env      # (Windows: copy .env.example .env)
npm run dev               # http://localhost:5173
```
Por padrão usa **dados simulados** (`VITE_USE_MOCK=true`). Para usar a API real, coloque `VITE_USE_MOCK=false`
e `VITE_API_URL` com a URL do Spring Boot (ou ajuste em *Configurações* no próprio painel).

## Contrato da API REST (combinar com o Back-end)
`GET /api/esteira/status`
```json
{ "esteiraId": "ESTEIRA-01", "nome": "Esteira de triagem 01", "operando": true,
  "ultimaLeitura": "2026-11-10T14:30:00Z", "totalMetalicas": 120, "totalNaoMetalicas": 74,
  "nivelReservatorio": 63.5 }
```
`GET /api/leituras?limite=200` (ordem cronológica crescente)
```json
[ { "id": 1, "timestamp": "2026-11-10T14:29:30Z", "tipoPeca": "METALICA", "nivelReservatorio": 62.0 } ]
```
- `tipoPeca`: `METALICA` ou `NAO_METALICA`; `nivelReservatorio` em porcentagem (0–100).
- O Spring Boot precisa liberar CORS para `http://localhost:5173` (`@CrossOrigin` ou `WebMvcConfigurer`).
- Se o contrato mudar, ajuste apenas `src/services/api.js`.

## Estrutura
```
src/
  components/  NavBar, KpiCard, ReservoirTank, Charts, BoxPlot, AlertList, Panel, DataGate...
  pages/       Dashboard, Analises, Leituras, Alertas, Configuracoes, NotFound
  context/     SettingsContext (tema, API, limiar), DataContext (polling + alertas)
  hooks/       usePolling
  services/    api.js (REST), mockApi.js (simulação)
  utils/       stats.js (estatística descritiva), alerts.js (critério de alerta), format.js
```

## Critérios do PDF atendidos
- **Consome a API REST** com atualização periódica (padrão 5 s, configurável).
- **Gráficos da Ciência de Dados**: linha (nível e contagem), pizza (proporção), histograma e boxplot; tabelas de média, mediana, moda, desvio padrão e quartis.
- **Alerta**: nível acima do limiar e enchimento acelerado (outlier pela regra Q3 + 1,5 × IQR).
- **Responsivo**, componentes reutilizáveis com props, estados (useState/Context), **rotas** (React Router) e **framework CSS** (Bootstrap).
- Tema claro/escuro, estados de carregamento/erro, exportação de leituras em CSV.
