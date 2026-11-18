# MetalTech RA (Eletiva I - Realidade Aumentada)

WebAR com **MindAR + A-Frame**: ao apontar a câmera do celular para a bancada, aparecem sobre ela
a contagem de peças **metálicas / não metálicas** e o valor atual dos **3 sensores** (indutivo, capacitivo e distância).
Consome a mesma API REST do dashboard React.

Elementos 3D: marcadores nos sensores (esfera + haste + anel, que pulsam e ficam verdes quando detectam) e **peças 3D** (dourada = metálica, vermelha = não metálica) que percorrem a esteira a cada leitura nova. O trajeto da peça é o `BELT` no `config.js`.

**Modo PC (gêmeo digital 3D):** se o computador não tiver câmera, `index.html` abre sozinho o `pc.html`, com um modelo 3D da bancada. Arraste para girar, role para aproximar e clique em um sensor para ver a descrição.

- Botão **Legendas** (ou tecla **L**): mostra/esconde as legendas dos 3 sensores, com o valor ao vivo.
- Painéis de dados: produção (metálicas, não metálicas, total) e os três sensores.
- **Sensor de distância a laser:** fica no final da esteira, em um suporte improvisado (bloco de madeira com grampo, poste de cantoneira e abraçadeiras), apontando para as peças que se aproximam. Mede a distância em mm e conta cada peça.

Arquivos: `js/gemeo.js` (modelo 3D), `js/hud.js` (interface) e `pc.html`.

## 1. Gerar o `targets.mind` (obrigatório)
O arquivo `assets/targets.mind` **não vem pronto**. Gere assim (igual ao do torno CNC):
1. Abra o compilador de imagens do MindAR (MindAR image targets compiler, no site de documentação do MindAR).
2. Envie `assets/images/target.jpg` (a foto da bancada, 1024x768).
3. Clique em *Start*, depois *Download* e salve como `assets/targets.mind`.

## 2. Rodar
- **Codespaces / local:** na pasta do projeto, `python3 -m http.server 8000` e abra a porta 8000 (no Codespaces, deixe a porta **Public** e abra o link `https://...`).
- **Docker:** `docker compose up` e abra `http://localhost:8080` no PC.
- A câmera do celular **só funciona em HTTPS** (ou localhost). Por isso o Codespaces com link https.

## 3. Usar
Aponte para a bancada **de cima**, como na foto. Com a bancada reconhecida, o painel aparece acima dela e as etiquetas dos sensores nas posições definidas.

## 4. Ajustes (`config.js`)
- `USE_MOCK: true` usa dados simulados. Para a API real: `USE_MOCK: false` e `API_URL`.
- `ANCHORS`: posição de cada sensor na foto (`u` = 0 esquerda a 1 direita, `v` = 0 topo a 1 base). Se a etiqueta não cair em cima do sensor, mude esses números.
- **API real a partir de página https:** o navegador bloqueia chamadas `http`. Use a API também em https (por exemplo, outra porta pública no Codespaces) e libere CORS para a origem da RA no Spring Boot.

## Contrato da API (igual ao dashboard)
`GET /api/esteira/status` -> `{ "operando": true, "totalMetalicas": 120, "totalNaoMetalicas": 74 }`
`GET /api/leituras?limite=100` -> `[ { "timestamp": "...", "indutivo": "0x0001", "capacitivo": "0x0001", "distancia": "0x00A3" } ]`
Sensores em hexadecimal (`"0x00A3"`) ou número; indutivo > 0 = metálica, só capacitivo > 0 = não metálica.
