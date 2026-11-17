// Gêmeo digital 3D da bancada (esteira de triagem), feito com geometrias do Three.js.
// Sistema de coordenadas: plano da bancada em XY (x = direita, y = fundo), z = para cima.
// Mesmas proporções da foto (largura = 1). Peças percorrem a esteira e são empurradas para as calhas.
(() => {
  const THREE = AFRAME.THREE;

  // Ajustes de luz (se ficar escuro/claro demais, mexa aqui)
  const LUZ_DIRECIONAL = 3.2;
  const LUZ_AMBIENTE = 2.2;

  // Geometria da esteira e do processo
  const VEL = 0.11; // velocidade da esteira (unidades/s)
  const X_INICIO = -0.40;
  const Y_ESTEIRA = 0.041;
  const Z_SUP = 0.040; // topo da correia
  const RAIO = 0.02;
  const ALT_PECA = 0.035;
  const Z_PECA = Z_SUP + ALT_PECA / 2;
  const X_IND = -0.344;
  const X_CAP = -0.369;
  const X_DIST = -0.073;
  const Y_SAIDA = 0.11; // a partir daqui a peça já está dentro da calha
  const Y_FUNDO = 0.31; // fundo da calha
  const ESTACOES_X = [0.10, 0.20, 0.30]; // 0 = metálicas, 1 = não metálicas, 2 = reserva

  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    alu: std({ color: 0xcfd5da, metalness: 0.7, roughness: 0.42 }),
    aluEscuro: std({ color: 0x8e979e, metalness: 0.75, roughness: 0.45 }),
    ranhura: std({ color: 0x2b3137, metalness: 0.3, roughness: 0.8 }),
    aco: std({ color: 0xc9d0d6, metalness: 1, roughness: 0.2 }),
    preto: std({ color: 0x1c2024, metalness: 0.25, roughness: 0.55 }),
    cinza: std({ color: 0x9aa3aa, metalness: 0.3, roughness: 0.6 }),
    cinzaClaro: std({ color: 0xc5cbd0, metalness: 0.2, roughness: 0.6 }),
    creme: std({ color: 0xe8e3d2, metalness: 0.05, roughness: 0.7 }),
    laranja: std({ color: 0xe8741e, metalness: 0.1, roughness: 0.45 }),
    azul: std({ color: 0x1f5fbf, metalness: 0.2, roughness: 0.4 }),
    verde: std({ color: 0x2fa557, metalness: 0.1, roughness: 0.5 }),
    amarelo: std({ color: 0xe5c11c, metalness: 0.1, roughness: 0.5 }),
    branco: std({ color: 0xf2f4f5, metalness: 0.1, roughness: 0.5 }),
    latao: std({ color: 0xd4a82a, metalness: 0.95, roughness: 0.28 }),
    vermelho: std({ color: 0xc0392b, metalness: 0.05, roughness: 0.45 }),
    vidro: std({ color: 0xbfe3f2, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22 }),
    tubo: std({ color: 0x2f7fd6, metalness: 0.1, roughness: 0.35 }),
  };

  function box(w, h, d, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Cilindro com eixo 'x', 'y' ou 'z'
  function cil(r, len, m, eixo, x = 0, y = 0, z = 0, seg = 28) {
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    if (eixo === 'x') g.rotateZ(Math.PI / 2);
    else if (eixo === 'z') g.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function tubo(pontos, raio, m) {
    const curva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    return new THREE.Mesh(new THREE.TubeGeometry(curva, 28, raio, 8, false), m);
  }

  function cunha() {
    const s = new THREE.Shape();
    s.moveTo(-0.032, 0);
    s.lineTo(0.032, 0);
    s.lineTo(0, 0.022);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
    g.translate(0, 0, Z_SUP + 0.003);
    return new THREE.Mesh(g, M.aco);
  }

  function texturaCanvas(w, h, desenhar) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    desenhar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function criarLed(cor) {
    const m = std({ color: 0x222222, emissive: cor, emissiveIntensity: 0.08, roughness: 0.4 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 10), m);
    return mesh;
  }
  const ligar = (led, on) => { led.material.emissiveIntensity = on ? 4 : 0.08; };

  /* ---------------------------------------------------------------- construção */
  function construir(ctx) {
    const r = ctx.root;

    // Placa de perfis de alumínio com ranhuras em T
    r.add(box(0.92, 0.60, 0.02, M.alu, 0, -0.0225, -0.01));
    for (let k = 0; k < 14; k += 1) r.add(box(0.92, 0.007, 0.002, M.ranhura, 0, 0.27 - k * 0.0445, 0.0005));
    const placa = texturaCanvas(512, 64, (c, w, h) => {
      c.fillStyle = '#1f2a33'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e0a21a'; c.fillRect(0, 0, 10, h);
      c.fillStyle = '#fff'; c.font = '600 34px system-ui, sans-serif'; c.fillText('MetalTech · Esteira 01', 28, 43);
    });
    const letreiro = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.03), new THREE.MeshStandardMaterial({ map: placa, roughness: 0.6 }));
    letreiro.position.set(0.12, -0.30, 0.0012);
    r.add(letreiro);

    /* ---- esteira ---- */
    const ex = -0.035; // centro em x
    for (const s of [-1, 1]) r.add(box(0.76, 0.012, 0.045, M.aluEscuro, ex, Y_ESTEIRA + s * 0.0435, 0.0225));
    const tex = texturaCanvas(256, 32, (c, w, h) => {
      c.fillStyle = '#23282d'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#31383f';
      for (let i = 0; i < w; i += 16) c.fillRect(i, 0, 6, h);
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(18, 1);
    ctx.texCorreia = tex;
    r.add(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.072, 0.012), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 })));
    r.children[r.children.length - 1].position.set(ex, Y_ESTEIRA, Z_SUP - 0.006);
    r.add(cil(0.018, 0.075, M.aco, 'y', X_INICIO - 0.005, Y_ESTEIRA, 0.022));
    r.add(cil(0.018, 0.075, M.aco, 'y', 0.335, Y_ESTEIRA, 0.022));
    // motor/redutor sob a esteira
    r.add(cil(0.033, 0.055, M.aco, 'z', 0.0, -0.045, 0.0275, 40));
    r.add(cil(0.012, 0.05, M.preto, 'z', 0.0, -0.045, 0.063));
    r.add(cil(0.008, 0.06, M.aco, 'y', 0.0, -0.015, 0.035));

    /* ---- sensores ---- */
    // Indutivo (cilindro cromado com fita verde)
    r.add(box(0.05, 0.05, 0.03, M.cinza, X_IND, 0.15, 0.015));
    r.add(cil(0.011, 0.09, M.aco, 'y', X_IND, 0.128, 0.045));
    r.add(cil(0.0125, 0.01, M.verde, 'y', X_IND, 0.15, 0.045));
    r.add(cil(0.0065, 0.04, M.preto, 'y', X_IND, 0.19, 0.045));
    ctx.leds.ind = criarLed(0x40ff90);
    ctx.leds.ind.position.set(X_IND, 0.118, 0.0575);
    r.add(ctx.leds.ind);

    // Capacitivo (cilindro laranja grande)
    r.add(box(0.08, 0.05, 0.006, M.cinza, X_CAP, -0.07, 0.003));
    r.add(cil(0.027, 0.11, M.laranja, 'y', X_CAP, -0.05, 0.036));
    for (const dy of [-0.075, -0.03]) r.add(cil(0.0275, 0.005, M.preto, 'y', X_CAP, dy, 0.036));
    r.add(cil(0.011, 0.035, M.amarelo, 'y', X_CAP, -0.118, 0.036));
    ctx.leds.cap = criarLed(0x40ff90);
    ctx.leds.cap.position.set(X_CAP, -0.01, 0.064);
    r.add(ctx.leds.cap);

    // Distância (módulo azul e branco)
    r.add(box(0.07, 0.045, 0.006, M.aluEscuro, X_DIST, -0.055, 0.003));
    r.add(box(0.052, 0.034, 0.03, M.cinzaClaro, X_DIST, -0.055, 0.021));
    r.add(box(0.034, 0.016, 0.004, M.azul, X_DIST, -0.058, 0.0375));
    r.add(cil(0.007, 0.008, M.preto, 'y', X_DIST, -0.034, 0.021, 20));
    ctx.leds.dist = criarLed(0x40a0ff);
    ctx.leds.dist.position.set(X_DIST + 0.018, -0.045, 0.0385);
    r.add(ctx.leds.dist);

    // Sensores ópticos (3 abaixo e 3 acima da esteira) e três sensores cinza ao fundo
    for (const x of [-0.29, -0.23, -0.17]) {
      r.add(box(0.05, 0.05, 0.004, M.aluEscuro, x, -0.03, 0.002));
      r.add(box(0.045, 0.032, 0.03, M.preto, x, -0.03, 0.019));
      const l = criarLed(0xff9a2e); l.position.set(x + 0.014, -0.014, 0.036); r.add(l);
      r.add(box(0.045, 0.05, 0.004, M.aluEscuro, x, 0.12, 0.002));
      r.add(box(0.045, 0.032, 0.03, M.preto, x, 0.12, 0.019));
      const l2 = criarLed(0xff9a2e); l2.position.set(x + 0.014, 0.104, 0.036); r.add(l2);
    }
    for (const y of [0.22, 0.185, 0.15]) r.add(box(0.034, 0.026, 0.024, M.cinzaClaro, -0.025, y, 0.012));

    /* ---- caixa de controle, calhas de cabo, válvulas ---- */
    r.add(box(0.15, 0.075, 0.035, M.creme, -0.225, 0.235, 0.0175));
    r.add(cil(0.008, 0.01, M.preto, 'z', -0.26, 0.24, 0.04));
    r.add(cil(0.008, 0.01, M.preto, 'z', -0.235, 0.215, 0.04));
    for (const dx of [-0.19, -0.175, -0.16]) r.add(box(0.008, 0.012, 0.01, M.preto, dx, 0.245, 0.04));
    r.add(box(0.03, 0.5, 0.035, M.cinza, -0.455, 0.03, 0.0175));
    for (let k = 0; k < 20; k += 1) r.add(box(0.032, 0.008, 0.0365, M.ranhura, -0.455, 0.27 - k * 0.025, 0.0175));
    r.add(box(0.36, 0.03, 0.03, M.cinza, -0.23, -0.105, 0.015));

    // Válvulas (canto inferior direito)
    r.add(box(0.11, 0.06, 0.05, M.cinzaClaro, 0.37, -0.285, 0.025));
    for (const dx of [-0.035, -0.012, 0.012, 0.035]) r.add(box(0.016, 0.05, 0.018, M.azul, 0.37 + dx, -0.285, 0.059));
    r.add(cil(0.009, 0.03, M.preto, 'x', 0.435, -0.285, 0.03));

    // Regulador de pressão com manômetro
    r.add(cil(0.018, 0.05, M.azul, 'z', 0.31, 0.235, 0.025));
    r.add(cil(0.02, 0.014, M.aluEscuro, 'z', 0.31, 0.235, 0.057));
    r.add(cil(0.028, 0.014, M.preto, 'z', 0.36, 0.245, 0.04));
    const mostrador = texturaCanvas(128, 128, (c, w, h) => {
      c.fillStyle = '#f4f5f6'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = 3;
      for (let a = -210; a <= 30; a += 30) {
        const rad = (a * Math.PI) / 180;
        c.beginPath(); c.moveTo(w / 2 + Math.cos(rad) * 44, h / 2 + Math.sin(rad) * 44);
        c.lineTo(w / 2 + Math.cos(rad) * 56, h / 2 + Math.sin(rad) * 56); c.stroke();
      }
      c.strokeStyle = '#d0302b'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 40, h / 2 - 22); c.stroke();
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.024, 40), new THREE.MeshStandardMaterial({ map: mostrador, roughness: 0.4 }));
    face.position.set(0.36, 0.245, 0.0475);
    r.add(face);
    r.add(cil(0.018, 0.02, M.cinza, 'z', 0.405, 0.0, 0.01));
    r.add(cil(0.014, 0.05, M.cinzaClaro, 'z', 0.405, 0.0, 0.045));

    // Coluna de vidro (canto superior direito)
    r.add(box(0.07, 0.05, 0.02, M.aluEscuro, 0.43, 0.31, 0.01));
    r.add(cil(0.03, 0.30, M.vidro, 'z', 0.43, 0.31, 0.17));

    /* ---- bloco de terminais (canto inferior esquerdo) ---- */
    r.add(box(0.33, 0.012, 0.008, M.aluEscuro, -0.27, -0.225, 0.004));
    for (let row = 0; row < 3; row += 1) {
      for (let i = 0; i < 26; i += 1) {
        const m = (i + row) % 7 === 0 ? M.laranja : (i % 5 === 0 ? M.cinzaClaro : M.cinza);
        r.add(box(0.0095, 0.022, 0.02, m, -0.425 + i * 0.0105, -0.205 - row * 0.034, 0.01));
      }
    }
    for (let i = 0; i < 7; i += 1) {
      r.add(box(0.012, 0.05, 0.026, M.azul, -0.15 + i * 0.0135, -0.265, 0.013));
      r.add(box(0.009, 0.026, 0.016, M.branco, -0.15 + i * 0.0135, -0.265, 0.034));
    }

    // Fios e mangueiras
    const fios = [
      [[-0.40, -0.195, 0.02], [-0.395, -0.15, 0.055], [-0.372, -0.118, 0.04], M.vermelho],
      [[-0.38, -0.195, 0.02], [-0.33, -0.12, 0.06], [-0.29, -0.05, 0.036], M.azul],
      [[-0.36, -0.195, 0.02], [-0.26, -0.1, 0.07], [-0.23, -0.05, 0.036], M.verde],
      [[-0.34, -0.195, 0.02], [-0.2, -0.13, 0.065], [-0.17, -0.05, 0.036], M.branco],
      [[-0.42, -0.19, 0.02], [-0.45, -0.05, 0.05], [-0.46, 0.12, 0.05], M.verde],
      [[-0.41, -0.19, 0.02], [-0.435, 0.05, 0.06], [-0.35, 0.21, 0.047], M.cinza],
      [[-0.30, -0.195, 0.02], [-0.14, -0.15, 0.07], [-0.073, -0.08, 0.03], M.vermelho],
    ];
    fios.forEach(([a, b, c, m]) => r.add(tubo([a, b, c], 0.0028, m)));
    r.add(tubo([[0.36, -0.26, 0.05], [0.25, -0.24, 0.085], [0.20, -0.19, 0.045]], 0.0042, M.tubo));
    r.add(tubo([[0.34, -0.27, 0.05], [0.2, -0.26, 0.09], [0.10, -0.19, 0.045]], 0.0042, M.tubo));
    r.add(tubo([[0.40, -0.26, 0.05], [0.46, -0.05, 0.07], [0.36, 0.22, 0.05]], 0.0042, M.tubo));

    /* ---- calhas de saída e atuadores ---- */
    ESTACOES_X.forEach((x, i) => {
      // calha
      r.add(box(0.074, 0.25, 0.012, M.alu, x, 0.215, 0.034));
      for (const s of [-1, 1]) r.add(box(0.006, 0.25, 0.034, M.aluEscuro, x + s * 0.0385, 0.215, 0.05));
      r.add(box(0.07, 0.008, 0.03, M.aluEscuro, x, 0.343, 0.05));
      // cilindro pneumático: corpo, haste e cunha
      r.add(cil(0.0125, 0.1, M.aluEscuro, 'y', x, -0.13, 0.04));
      r.add(cil(0.0135, 0.012, M.azul, 'y', x, -0.18, 0.04));
      r.add(box(0.034, 0.03, 0.01, M.cinza, x, -0.12, 0.01));
      const haste = cil(0.0042, 1, M.aco, 'y', x, 0, 0.04, 12);
      const c = cunha();
      c.position.x = x;
      r.add(haste, c);
      ctx.estacoes.push({ x, e: 0, estado: 'idle', haste, cunha: c, base: -0.045 });
    });
    atualizarEstacoes(ctx, 0);

    // grade de fundo dos mancais (detalhe)
    r.add(box(0.2, 0.012, 0.014, M.aluEscuro, 0.20, 0.355, 0.007));
  }

  function atualizarEstacoes(ctx, dt) {
    for (const st of ctx.estacoes) {
      if (st.estado === 'ext') st.e = Math.min(1, st.e + dt * 2.6);
      else if (st.estado === 'ret') {
        st.e = Math.max(0, st.e - dt * 1.8);
        if (st.e === 0) st.estado = 'idle';
      }
      const base = -0.045 + st.e * 0.115;
      st.base = base;
      st.cunha.position.y = base;
      const comp = Math.max(0.001, base + 0.08);
      st.haste.scale.y = comp;
      st.haste.position.y = -0.08 + comp / 2;
    }
  }

  /* ---------------------------------------------------------------- ambiente (reflexos) */
  function criarAmbiente(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const cena = new THREE.Scene();
    const ceu = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(vec3(0.22, 0.25, 0.29), vec3(0.85, 0.9, 0.96), h), 1.0); }',
      }),
    );
    cena.add(ceu);
    const luz = (w, h, x, y, z, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      cena.add(m);
    };
    luz(6, 3, 0, 7, 2, 8);
    luz(2, 5, -7, 3, 1, 4);
    luz(2, 5, 7, 3, -1, 3);
    const tex = pmrem.fromScene(cena, 0.04).texture;
    pmrem.dispose();
    return tex;
  }

  /* ---------------------------------------------------------------- componente */
  AFRAME.registerComponent('gemeo-3d', {
    init() {
      this.root = new THREE.Group();
      this.pecas = [];
      this.filas = [[], []];
      this.rodando = true;
      this.ctx = { root: this.root, leds: {}, estacoes: [], texCorreia: null };
      this.geoPeca = new THREE.CylinderGeometry(RAIO, RAIO, ALT_PECA, 32);
      this.geoPeca.rotateX(Math.PI / 2);
      try {
        construir(this.ctx);
      } catch (e) {
        console.error('Erro ao montar o gêmeo 3D:', e);
        const aviso = document.querySelector('#dica');
        if (aviso) aviso.textContent = 'Erro ao montar o modelo 3D (veja o Console).';
      }
      this.el.setObject3D('gemeo', this.root);
      const pronto = () => this.prepararCena();
      if (this.el.sceneEl.hasLoaded) pronto();
      else this.el.sceneEl.addEventListener('loaded', pronto);
    },

    prepararCena() {
      const cenaEl = this.el.sceneEl;
      const renderer = cenaEl.renderer;
      try {
        if (renderer) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          const env = criarAmbiente(renderer);
          this.root.traverse((o) => {
            if (o.isMesh && o.material && o.material.isMeshStandardMaterial) {
              o.material.envMap = env;
              o.material.envMapIntensity = 1.1;
              o.material.needsUpdate = true;
            }
          });
          Object.values(M).forEach((m) => { m.envMap = env; m.envMapIntensity = 1.1; m.needsUpdate = true; });
          this.env = env;
        }
      } catch (e) {
        console.warn('Reflexos desativados:', e);
      }
      this.root.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });
      const sol = new THREE.DirectionalLight(0xffffff, LUZ_DIRECIONAL);
      sol.position.set(0.5, -0.7, 1.3);
      sol.castShadow = true;
      sol.shadow.mapSize.set(2048, 2048);
      const c = sol.shadow.camera;
      c.left = -0.8; c.right = 0.8; c.top = 0.8; c.bottom = -0.8; c.near = 0.1; c.far = 4;
      sol.shadow.bias = -0.0004;
      this.root.add(sol);
      this.root.add(new THREE.HemisphereLight(0xdfe9f5, 0x40474f, LUZ_AMBIENTE));
    },

    setRodando(v) { this.rodando = !!v; },

    spawn(tipo) {
      if (this.pecas.length > 24) return;
      const metal = tipo === 'METALICA';
      const mesh = new THREE.Mesh(this.geoPeca, metal ? M.latao : M.vermelho);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(X_INICIO, Y_ESTEIRA, Z_PECA);
      this.root.add(mesh);
      this.pecas.push({ mesh, tipo, estado: 'esteira', x: X_INICIO, y: Y_ESTEIRA, alvo: metal ? 0 : 1 });
    },

    tick(_t, dtMs) {
      const dt = Math.min((dtMs || 16) / 1000, 0.05);
      const { estacoes, leds, texCorreia } = this.ctx;
      if (this.rodando && texCorreia) texCorreia.offset.x -= VEL * 24.3 * dt;

      for (const p of [...this.pecas]) {
        if (p.estado === 'esteira') {
          if (this.rodando) p.x += VEL * dt;
          const st = estacoes[p.alvo];
          if (st && p.x >= st.x) {
            p.x = st.x;
            p.estado = 'empurrando';
            st.estado = 'ext';
          }
        } else if (p.estado === 'empurrando') {
          const st = estacoes[p.alvo];
          p.y = Math.max(p.y, st.base + 0.022 + RAIO);
          if (p.y >= Y_SAIDA) {
            p.estado = 'deslizando';
            st.estado = 'ret';
            const fila = this.filas[p.alvo];
            if (fila.length >= 5) { // calha cheia: esvazia
              fila.forEach((q) => {
                this.root.remove(q.mesh);
                const i = this.pecas.indexOf(q);
                if (i >= 0) this.pecas.splice(i, 1);
              });
              fila.length = 0;
            }
            p.yFinal = Y_FUNDO - fila.length * 0.045;
            fila.push(p);
          }
        } else if (p.estado === 'deslizando') {
          p.y = Math.min(p.yFinal, p.y + 0.16 * dt);
          if (p.y >= p.yFinal) p.estado = 'guardada';
        }
        p.mesh.position.set(p.x, p.y, Z_PECA);
      }

      atualizarEstacoes(this.ctx, dt);

      // LEDs dos sensores seguem as peças que passam
      let ind = false;
      let cap = false;
      let dist = false;
      for (const p of this.pecas) {
        if (p.estado !== 'esteira' && p.estado !== 'empurrando') continue;
        if (p.tipo === 'METALICA' && Math.abs(p.x - X_IND) < 0.04) ind = true;
        if (Math.abs(p.x - X_CAP) < 0.045) cap = true;
        if (Math.abs(p.x - X_DIST) < 0.04) dist = true;
      }
      if (leds.ind) { ligar(leds.ind, ind); ligar(leds.cap, cap); ligar(leds.dist, dist); }
    },
  });
})();
