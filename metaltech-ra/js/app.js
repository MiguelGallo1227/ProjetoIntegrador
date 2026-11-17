// RA da esteira: componente de etiqueta (canvas), leitura da API e conversao de hexadecimal.
(() => {
  const cfg = window.RA_CONFIG;
  const THREE = AFRAME.THREE;
  const ASPECT = cfg.TARGET_HEIGHT / cfg.TARGET_WIDTH; // altura do target com largura = 1

  /* ---------- conversao dos sensores (mesma logica do dashboard) ---------- */
  function parseSensor(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'boolean') return raw ? 1 : 0;
    if (typeof raw === 'number') return raw;
    const n = parseInt(String(raw).trim().replace(/^0x/i, ''), 16);
    return Number.isNaN(n) ? null : n;
  }
  const hexLabel = (raw, v) =>
    typeof raw === 'string' ? raw : v === null ? '–' : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`;
  // indutivo => metalica; so capacitivo => nao metalica
  const classify = (ind, cap) => (ind > 0 ? 'METALICA' : cap > 0 ? 'NAO_METALICA' : null);

  function normalize(l) {
    const indutivo = parseSensor(l.indutivo);
    const capacitivo = parseSensor(l.capacitivo);
    return {
      timestamp: l.timestamp,
      indutivo, capacitivo, distancia: parseSensor(l.distancia),
      raw: { indutivo: l.indutivo, capacitivo: l.capacitivo, distancia: l.distancia },
      tipoPeca: l.tipoPeca || classify(indutivo, capacitivo),
    };
  }

  /* ---------- API (real ou simulada) ---------- */
  const STEP = 5000;
  const hash = (n) => { let x = (n * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967295; };
  const hex = (n) => `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
  const metal = (i) => hash(i) < 0.62;

  async function mockData() {
    const now = Math.floor(Date.now() / STEP);
    const start = Math.floor(new Date().setHours(0, 0, 0, 0) / STEP);
    let m = 0, n = 0;
    for (let i = start; i <= now; i += 1) (metal(i) ? m++ : n++);
    const leitura = (i) => ({ timestamp: new Date(i * STEP).toISOString(), indutivo: hex(metal(i) ? 1 : 0), capacitivo: hex(1), distancia: hex(Math.round(40 + hash(i + 3) * 260)) });
    return {
      status: { operando: true, totalMetalicas: m, totalNaoMetalicas: n },
      leituras: [leitura(now - 2), leitura(now - 1), leitura(now)],
    };
  }

  async function get(path) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(cfg.API_URL.replace(/\/$/, '') + path, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  async function loadData() {
    if (cfg.USE_MOCK) return mockData();
    const [status, leituras] = await Promise.all([get('/api/esteira/status'), get('/api/leituras?limite=100')]);
    const norm = leituras.map(normalize);
    const contar = (t) => norm.filter((l) => l.tipoPeca === t).length;
    return {
      status: {
        operando: status.operando,
        totalMetalicas: status.totalMetalicas ?? contar('METALICA'),
        totalNaoMetalicas: status.totalNaoMetalicas ?? contar('NAO_METALICA'),
      },
      leituras: leituras.slice(-5),
    };
  }

  /* ---------- componente: etiqueta desenhada em canvas ---------- */
  AFRAME.registerComponent('ra-label', {
    schema: { width: { default: 0.3 }, height: { default: 0.12 }, px: { default: 640 } },
    init() {
      const { width, height, px } = this.data;
      this.canvas = document.createElement('canvas');
      this.canvas.width = px;
      this.canvas.height = Math.round((px * height) / width);
      this.ctx = this.canvas.getContext('2d');
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, toneMapped: false });
      this.el.setObject3D('mesh', new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat));
    },
    draw(fn) {
      const { ctx, canvas } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fn(ctx, canvas.width, canvas.height);
      this.texture.needsUpdate = true;
    },
  });

  function card(ctx, w, h, accent) {
    const r = 26;
    ctx.fillStyle = 'rgba(31, 42, 51, 0.92)';
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r); ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 14, h);
  }
  const font = (px, weight = 600) => `${weight} ${px}px system-ui, "Segoe UI", Roboto, sans-serif`;

  /* ---------- cena ---------- */
  const targetEl = document.querySelector('#target');
  const posOf = (u, v, z = 0.02, dy = 0) => `${(u - 0.5).toFixed(4)} ${((0.5 - v) * ASPECT + dy).toFixed(4)} ${z}`;

  const painel = document.createElement('a-entity');
  painel.setAttribute('ra-label', { width: 0.9, height: 0.3, px: 1024 });
  painel.setAttribute('position', `0 ${(ASPECT / 2 + 0.2).toFixed(3)} 0.02`);
  if (window.RA_PC) painel.setAttribute('billboard', '');
  targetEl.appendChild(painel);

  const SENSORES = {
    indutivo:   { titulo: 'Indutivo',   cor: '#2a7f9e' },
    capacitivo: { titulo: 'Capacitivo', cor: '#d9822b' },
    distancia:  { titulo: 'Distância',  cor: '#9db2c2' },
  };
  const etiquetas = {};
  const pinos = {};
  Object.entries(cfg.ANCHORS).forEach(([chave, a]) => {
    if (!window.RA_PC) {
    const grupo = document.createElement('a-entity');
    grupo.setAttribute('position', posOf(a.u, a.v, 0));
    const anel = document.createElement('a-ring');
    anel.setAttribute('radius-inner', 0.026);
    anel.setAttribute('radius-outer', 0.036);
    anel.setAttribute('position', '0 0 0.004');
    anel.setAttribute('material', 'shader: flat; color: #9aa7b1; opacity: 0.9');
    const haste = document.createElement('a-cylinder');
    haste.setAttribute('radius', 0.004);
    haste.setAttribute('height', 0.07);
    haste.setAttribute('rotation', '90 0 0');
    haste.setAttribute('position', '0 0 0.04');
    haste.setAttribute('material', 'color: #c6d0d8; metalness: 0.3; roughness: 0.4');
    const esfera = document.createElement('a-sphere');
    esfera.setAttribute('radius', 0.02);
    esfera.setAttribute('position', '0 0 0.08');
    esfera.setAttribute('material', 'color: #9aa7b1; emissive: #9aa7b1; emissiveIntensity: 0.5; roughness: 0.4');
    grupo.append(anel, haste, esfera);
    targetEl.appendChild(grupo);
    pinos[chave] = { esfera, anel, ativo: null };
    }

    const et = document.createElement('a-entity');
    et.setAttribute('ra-label', { width: 0.28, height: 0.13, px: 560 });
    et.setAttribute('position', posOf(a.u, a.v, 0.13, 0.09));
    if (window.RA_PC) et.setAttribute('billboard', '');
    targetEl.appendChild(et);
    etiquetas[chave] = et;
  });

  /* ---------- desenho dos dados ---------- */
  let ultimo = null;
  let erro = null;

  function desenharPainel() {
    const c = painel.components['ra-label'];
    if (!c) return;
    c.draw((ctx, w, h) => {
      card(ctx, w, h, '#e0a21a');
      ctx.fillStyle = '#fff';
      ctx.font = font(44, 700);
      ctx.fillText('Esteira de triagem', 44, 64);
      const s = ultimo?.status;
      ctx.font = font(30, 500);
      ctx.fillStyle = erro ? '#ff8d84' : s?.operando ? '#7fe0b0' : '#c6d0d8';
      ctx.textAlign = 'right';
      ctx.fillText(erro ? 'Sem conexão' : s ? (s.operando ? 'Operando' : 'Parada') : 'Carregando…', w - 36, 62);
      ctx.textAlign = 'left';

      const colunas = [
        ['Metálicas', s?.totalMetalicas, '#5fc0e3'],
        ['Não metálicas', s?.totalNaoMetalicas, '#f2a65a'],
        ['Total', s ? s.totalMetalicas + s.totalNaoMetalicas : null, '#ffffff'],
      ];
      const largura = (w - 88) / 3;
      colunas.forEach(([nome, valor, cor], i) => {
        const x = 44 + i * largura;
        ctx.fillStyle = '#c6d0d8';
        ctx.font = font(28, 500);
        ctx.fillText(nome, x, 130);
        ctx.fillStyle = cor;
        ctx.font = font(96, 700);
        ctx.fillText(valor ?? '–', x, 232);
      });
    });
  }

  function marcar(chave, cor, pulsar) {
    const p = pinos[chave];
    if (!p) return;
    p.esfera.setAttribute('material', { color: cor, emissive: cor, emissiveIntensity: pulsar ? 1 : 0.5 });
    p.anel.setAttribute('material', { color: cor });
    if (p.ativo === pulsar) return;
    p.ativo = pulsar;
    if (pulsar) {
      p.esfera.setAttribute('animation__pulso', 'property: scale; from: 1 1 1; to: 1.5 1.5 1.5; dir: alternate; loop: true; dur: 450; easing: easeInOutSine');
    } else {
      p.esfera.removeAttribute('animation__pulso');
      p.esfera.setAttribute('scale', '1 1 1');
    }
  }

  // Peca 3D que percorre a esteira (dourada = metalica, vermelha = nao metalica)
  function spawnPeca(tipo) {
    if (window.RA_PC) {
      const g = document.querySelector('#gemeo');
      if (g && g.components && g.components['gemeo-3d']) g.components['gemeo-3d'].spawn(tipo);
      return;
    }
    const b = cfg.BELT;
    const from = posOf(b.u1, b.v, 0.03);
    const to = posOf(b.u2, b.v, 0.03);
    const peca = document.createElement('a-cylinder');
    peca.setAttribute('radius', 0.024);
    peca.setAttribute('height', 0.05);
    peca.setAttribute('rotation', '90 0 0');
    peca.setAttribute('material', `color: ${tipo === 'METALICA' ? '#d4a82a' : '#c0392b'}; metalness: 0.4; roughness: 0.35`);
    peca.setAttribute('position', from);
    peca.setAttribute('animation', `property: position; from: ${from}; to: ${to}; dur: ${b.DURACAO}; easing: linear`);
    peca.addEventListener('animationcomplete', () => peca.remove());
    targetEl.appendChild(peca);
  }

  let ultimoTs = null;
  function processarNovas() {
    let novas = (ultimo?.leituras || []).filter((l) => !ultimoTs || l.timestamp > ultimoTs);
    if (!novas.length) return;
    ultimoTs = novas[novas.length - 1].timestamp;
    if (novas.length > 3) novas = novas.slice(-3);
    novas.forEach((l, i) => {
      const tipo = normalize(l).tipoPeca;
      if (tipo) setTimeout(() => spawnPeca(tipo), i * 1200);
    });
  }

  function desenharSensor(chave) {
    const c = etiquetas[chave].components['ra-label'];
    if (!c) return;
    const bruto = ultimo?.leituras?.[ultimo.leituras.length - 1];
    const l = bruto ? normalize(bruto) : null;
    const valor = l ? l[chave] : null;
    const ativo = valor > 0;
    let texto = '–';
    if (valor !== null) {
      if (chave === 'indutivo') texto = ativo ? 'Metal detectado' : 'Sem metal';
      else if (chave === 'capacitivo') texto = ativo ? 'Material detectado' : 'Livre';
      else texto = `Valor: ${valor}`;
    }
    const cor = chave === 'distancia' || !ativo ? '#c6d0d8' : '#7fe0b0';
    marcar(chave, chave === 'distancia' ? '#9db2c2' : ativo ? '#46c28a' : '#9aa7b1', chave !== 'distancia' && ativo);

    c.draw((ctx, w, h) => {
      card(ctx, w, h, SENSORES[chave].cor);
      ctx.fillStyle = '#fff';
      ctx.font = font(36, 700);
      ctx.fillText(`Sensor ${SENSORES[chave].titulo.toLowerCase()}`, 34, 50);
      ctx.fillStyle = cor;
      ctx.font = font(40, 700);
      ctx.fillText(texto, 34, 100);
      ctx.fillStyle = '#9db2c2';
      ctx.font = font(26, 500);
      ctx.fillText(`Recebido: ${l ? hexLabel(l.raw[chave], valor) : '–'}`, 34, 134);
    });
  }

  function redesenhar() {
    desenharPainel();
    Object.keys(etiquetas).forEach(desenharSensor);
  }

  /* ---------- ciclo de atualizacao ---------- */
  const conexao = document.querySelector('#conexao');
  const conexaoTxt = document.querySelector('#conexao-txt');
  function mostrarConexao() {
    conexao.className = erro ? 'erro' : cfg.USE_MOCK ? 'mock' : 'ok';
    conexaoTxt.textContent = erro ? 'Sem conexão com a API' : cfg.USE_MOCK ? 'Dados simulados' : 'Ao vivo';
  }

  async function atualizar() {
    try {
      ultimo = await loadData();
      if (window.RA_PC) {
        const g = document.querySelector('#gemeo');
        if (g && g.components && g.components['gemeo-3d']) g.components['gemeo-3d'].setRodando(ultimo.status.operando !== false);
      }
      erro = null;
    } catch (e) {
      erro = e.message;
    }
    mostrarConexao();
    if (!erro) processarNovas();
    redesenhar();
  }

  document.querySelector('a-scene').addEventListener('loaded', () => {
    setTimeout(() => { redesenhar(); atualizar(); setInterval(atualizar, cfg.INTERVALO * 1000); }, 300);
  });
  targetEl.addEventListener('targetFound', () => { document.querySelector('#dica').textContent = 'Bancada reconhecida.'; });
  targetEl.addEventListener('targetLost', () => { document.querySelector('#dica').textContent = 'Aponte a câmera para a bancada, de cima.'; });

  /* ---------- diagnostico na tela (mostra o que esta carregando) ---------- */
  const dica = document.querySelector('#dica');
  const sceneEl = document.querySelector('a-scene');
  const dicaPadrao = 'Aponte a câmera para a bancada, de cima.';
  if (window.RA_PC) {
    dica.textContent = 'Modelo 3D: arraste para girar, role para aproximar.';
  } else {
  fetch('./assets/targets.mind')
    .then(async (r) => {
      const blob = await r.blob();
      const mb = (blob.size / 1048576).toFixed(1);
      if (!r.ok) dica.textContent = `targets.mind não encontrado (erro ${r.status})`;
      else if (blob.type.includes('text/html')) dica.textContent = 'targets.mind veio como página HTML (porta privada?)';
      else dica.textContent = `Alvo carregado (${mb} MB). Iniciando a câmera…`;
    })
    .catch(() => { dica.textContent = 'Não consegui baixar o targets.mind'; });
  sceneEl.addEventListener('arReady', () => { dica.textContent = dicaPadrao; });
  sceneEl.addEventListener('arError', () => { dica.textContent = 'Erro ao abrir a câmera. Permita o acesso e use https.'; });
  }
})();
