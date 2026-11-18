// Gêmeo digital 3D da bancada (esteira de triagem), feito com geometrias do Three.js.
// Coordenadas: plano da bancada em XY (x = direita, y = fundo), z = para cima. Largura da bancada ~ 1 unidade (~1 m).
// Sensor de distância a laser: feixe vermelho que mede (em mm) a distância até a peça ou até o anteparo.
(() => {
  window.RA_V = window.RA_V || {};
  window.RA_V.gemeo = 6;
  const THREE = AFRAME.THREE;

  // Ajustes de luz (se ficar escuro/claro demais, mexa aqui)
  const LUZ_DIRECIONAL = 3.2;
  const LUZ_AMBIENTE = 2.2;

  const VEL = 0.11; // velocidade da esteira (unidades/s)
  const X_INICIO = -0.40;
  const Y_ESTEIRA = 0.041;
  const Z_SUP = 0.040; // topo da correia
  const RAIO = 0.02;
  const ALT_PECA = 0.035;
  const Z_PECA = Z_SUP + ALT_PECA / 2;
  const X_IND = -0.36; // indutivo (embaixo) e capacitivo (em cima) ficam alinhados, um embaixo do outro
  const X_CAP = -0.36;
  const X_LASER = 0.3745; // saída do feixe (no final da esteira, apontando para o início)
  const X_FUNDO = -0.44; // fundo que o laser enxerga quando não há peça
  const ALCANCE_CONTAGEM = 0.5; // a peça é contada ao entrar nesta distância
  const Y_SAIDA = 0.11;
  const Y_FUNDO = 0.31;
  const ESTACOES_X = [0.10, 0.20, 0.30]; // 0 = metálicas, 1 = não metálicas, 2 = reserva

  const INFO = {
    base: ['Bancada didática', 'Placa de perfis de alumínio com ranhuras em T onde todos os módulos são fixados.'],
    esteira: ['Esteira transportadora', 'Leva as peças até os separadores. Acionada por motor com redutor.'],
    motor: ['Motor da esteira', 'Motor com redutor que movimenta a correia.'],
    indutivo: ['Sensor indutivo', 'Detecta somente peças metálicas, sem contato. Junto com o capacitivo, classifica a peça.'],
    capacitivo: ['Sensor capacitivo', 'Detecta qualquer material (metal, plástico, madeira). Se só ele atua, a peça é não metálica.'],
    distancia: ['Sensor de distância a laser', 'Fica no final da esteira, preso em um suporte improvisado, apontando para as peças que se aproximam. Mede a distância até cada peça e conta quantas passaram.'],
    opticos: ['Sensores ópticos', 'Sensores de barreira usados para posição e fim de curso do processo.'],
    suporte: ['Suporte dos sensores', 'Poste que segura o sensor indutivo (embaixo) e o capacitivo (em cima), um sobre o outro, apontados para a esteira.'],
    painel: ['Painel de comando', 'Caixa de comando com seletores e botões da bancada.'],
    torre: ['Torre de sinalização', 'Verde = esteira em operação, vermelho = parada, amarelo = separador atuando.'],
    terminais: ['Bloco de terminais e relés', 'Interface elétrica entre sensores, atuadores e o controlador (CLP).'],
    valvulas: ['Bloco de válvulas', 'Válvulas solenoides que comandam os cilindros pneumáticos.'],
    regulador: ['Regulador de pressão', 'Regula a pressão do ar comprimido com manômetro.'],
    coluna: ['Coluna de vidro', 'Reservatório/coluna transparente do conjunto.'],
    calha1: ['Calha 1 · Metálicas', 'Recebe as peças classificadas como metálicas.'],
    calha2: ['Calha 2 · Não metálicas', 'Recebe as peças classificadas como não metálicas.'],
    calha3: ['Calha 3 · Reserva', 'Calha reserva (sem uso neste processo).'],
    separador1: ['Separador pneumático 1', 'Cilindro que empurra a peça metálica para a calha 1.'],
    separador2: ['Separador pneumático 2', 'Cilindro que empurra a peça não metálica para a calha 2.'],
    separador3: ['Separador pneumático 3', 'Cilindro reserva.'],
  };

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
    mesa: std({ color: 0x4a3c30, metalness: 0, roughness: 0.9 }),
    madeira: std({ color: 0x9a7448, metalness: 0, roughness: 0.9 }),
    fita: std({ color: 0xf0c419, metalness: 0, roughness: 0.6 }),
    grampo: std({ color: 0x2f3b46, metalness: 0.6, roughness: 0.5 }),
  };

  function box(w, h, d, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    return mesh;
  }
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
    s.moveTo(-0.032, 0); s.lineTo(0.032, 0); s.lineTo(0, 0.022); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
    g.translate(0, 0, Z_SUP + 0.003);
    return new THREE.Mesh(g, M.aco);
  }
  function texturaCanvas(w, h, desenhar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    desenhar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function criarLed(cor) {
    const m = std({ color: 0x222222, emissive: cor, emissiveIntensity: 0.08, roughness: 0.4 });
    return new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 10), m);
  }
  const ligar = (obj, on, forca = 4) => { obj.material.emissiveIntensity = on ? forca : 0.08; };

  /* ---------------------------------------------------------------- construção */
  function construir(ctx) {
    const r = ctx.root;
    let A = r;
    const parte = (id) => {
      const g = new THREE.Group();
      g.userData = { id, titulo: INFO[id][0], desc: INFO[id][1] };
      r.add(g);
      ctx.partes[id] = g;
      A = g;
    };
    const add = (...m) => A.add(...m);

    /* ---- mesa e bancada ---- */
    parte('base');
    add(box(1.5, 1.05, 0.03, M.mesa, 0, -0.02, -0.04));
    add(box(0.92, 0.60, 0.02, M.alu, 0, -0.0225, -0.01));
    for (let k = 0; k < 14; k += 1) add(box(0.92, 0.007, 0.002, M.ranhura, 0, 0.27 - k * 0.0445, 0.0005));
    for (const sx of [-0.43, 0.43]) for (const sy of [-0.28, 0.24]) add(box(0.035, 0.035, 0.03, M.preto, sx, sy, -0.025));
    const placa = texturaCanvas(512, 64, (c, w, h) => {
      c.fillStyle = '#1f2a33'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e0a21a'; c.fillRect(0, 0, 10, h);
      c.fillStyle = '#fff'; c.font = '600 34px system-ui, sans-serif'; c.fillText('MetalTech · Esteira 01', 28, 43);
    });
    const letreiro = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.03), new THREE.MeshStandardMaterial({ map: placa, roughness: 0.6 }));
    letreiro.position.set(0.12, -0.30, 0.0012);
    add(letreiro);

    /* ---- esteira ---- */
    parte('esteira');
    const ex = -0.035;
    for (const s of [-1, 1]) add(box(0.76, 0.012, 0.045, M.aluEscuro, ex, Y_ESTEIRA + s * 0.0435, 0.0225));
    const tex = texturaCanvas(256, 32, (c, w, h) => {
      c.fillStyle = '#23282d'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#31383f';
      for (let i = 0; i < w; i += 16) c.fillRect(i, 0, 6, h);
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(18, 1);
    ctx.texCorreia = tex;
    const correia = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.072, 0.012), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 }));
    correia.position.set(ex, Y_ESTEIRA, Z_SUP - 0.006);
    add(correia);
    add(cil(0.018, 0.075, M.aco, 'y', X_INICIO - 0.005, Y_ESTEIRA, 0.022));
    add(cil(0.018, 0.075, M.aco, 'y', 0.335, Y_ESTEIRA, 0.022));
    add(box(0.36, 0.03, 0.03, M.cinza, -0.23, -0.105, 0.015));

    parte('motor');
    add(cil(0.033, 0.055, M.aco, 'z', 0.0, -0.045, 0.0275, 40));
    add(cil(0.012, 0.05, M.preto, 'z', 0.0, -0.045, 0.063));
    add(cil(0.008, 0.06, M.aco, 'y', 0.0, -0.015, 0.035));

    /* ---- sensores ---- */
    // Indutivo (embaixo) e capacitivo (em cima): empilhados no mesmo poste, apontando para a esteira
    const XS2 = X_IND;
    const Z_IND = Z_PECA; // na altura do meio da peça
    const Z_CAP = 0.105; // logo acima do indutivo
    parte('suporte');
    add(box(0.08, 0.05, 0.006, M.cinza, XS2, -0.115, 0.003));
    add(box(0.03, 0.012, 0.16, M.aluEscuro, XS2, -0.108, 0.08));
    add(box(0.05, 0.02, 0.004, M.aluEscuro, XS2, -0.108, 0.165));

    parte('indutivo');
    add(cil(0.011, 0.092, M.aco, 'y', XS2, -0.046, Z_IND));
    add(cil(0.0125, 0.01, M.verde, 'y', XS2, -0.075, Z_IND));
    add(cil(0.0135, 0.012, M.aluEscuro, 'y', XS2, -0.1, Z_IND));
    add(cil(0.0065, 0.04, M.preto, 'y', XS2, -0.112, Z_IND));
    ctx.leds.ind = criarLed(0x40ff90);
    ctx.leds.ind.position.set(XS2, -0.012, Z_IND + 0.0125);
    add(ctx.leds.ind);

    parte('capacitivo');
    add(cil(0.027, 0.11, M.laranja, 'y', XS2, -0.05, Z_CAP));
    for (const dy of [-0.075, -0.03]) add(cil(0.0275, 0.005, M.preto, 'y', XS2, dy, Z_CAP));
    add(cil(0.011, 0.035, M.amarelo, 'y', XS2, -0.118, Z_CAP));
    ctx.leds.cap = criarLed(0x40ff90);
    ctx.leds.cap.position.set(XS2, -0.012, Z_CAP + 0.0275);
    add(ctx.leds.cap);

    // Sensor de distância a laser no final da esteira, em um suporte improvisado
    parte('distancia');
    const Z_L = Z_PECA;
    const XS = 0.40; // centro do corpo do sensor
    // bloco de madeira preso na bancada por um grampo "sargento"
    add(box(0.06, 0.07, 0.03, M.madeira, 0.41, Y_ESTEIRA, 0.015));
    add(box(0.07, 0.016, 0.006, M.grampo, 0.43, Y_ESTEIRA, 0.033));
    add(box(0.008, 0.016, 0.058, M.grampo, 0.466, Y_ESTEIRA, 0.007));
    add(box(0.05, 0.016, 0.005, M.grampo, 0.445, Y_ESTEIRA, -0.0225));
    add(cil(0.003, 0.03, M.aco, 'z', 0.44, Y_ESTEIRA, 0.045, 12));
    add(box(0.03, 0.004, 0.004, M.vermelho, 0.44, Y_ESTEIRA, 0.062));
    // poste de cantoneira de alumínio, meio torto, com o sensor amarrado
    const poste = new THREE.Group();
    poste.position.set(0.425, Y_ESTEIRA, 0);
    poste.rotation.set(0.05, 0.06, 0.035);
    poste.add(box(0.014, 0.014, 0.09, M.aluEscuro, 0, 0, 0.075));
    poste.add(box(0.03, 0.014, 0.003, M.aluEscuro, -0.008, 0, 0.032));
    add(poste);
    // corpo do sensor (apontando para -x)
    add(box(0.034, 0.052, 0.03, M.cinzaClaro, XS, Y_ESTEIRA, Z_L));
    add(box(0.016, 0.034, 0.004, M.azul, XS, Y_ESTEIRA, Z_L + 0.017));
    add(cil(0.007, 0.008, M.preto, 'x', XS - 0.0205, Y_ESTEIRA, Z_L, 24));
    const matLente = new THREE.MeshBasicMaterial({ color: 0xff3a3a });
    add(cil(0.0045, 0.002, matLente, 'x', XS - 0.0255, Y_ESTEIRA, Z_L, 20));
    // amarrações: abraçadeiras pretas e fita amarela
    add(box(0.044, 0.056, 0.004, M.preto, XS + 0.004, Y_ESTEIRA, Z_L + 0.008));
    add(box(0.034, 0.02, 0.004, M.preto, XS + 0.021, Y_ESTEIRA, 0.095));
    add(box(0.034, 0.02, 0.012, M.fita, 0.412, Y_ESTEIRA + 0.036, 0.0165));
    // cabo solto
    add(tubo([[0.425, Y_ESTEIRA, 0.07], [0.455, 0.085, 0.09], [0.457, 0.2, 0.012]], 0.0025, M.preto));
    ctx.leds.dist = criarLed(0xff4040);
    ctx.leds.dist.position.set(XS - 0.002, Y_ESTEIRA + 0.0235, Z_L + 0.0165);
    add(ctx.leds.dist);
    // feixe laser (eixo ao longo de x)
    const gFeixe = new THREE.CylinderGeometry(0.0012, 0.0012, 1, 8); gFeixe.rotateZ(Math.PI / 2);
    const gBrilho = new THREE.CylinderGeometry(0.0038, 0.0038, 1, 12); gBrilho.rotateZ(Math.PI / 2);
    const matFeixe = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.95 });
    const matBrilho = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending });
    const matPonto = new THREE.MeshBasicMaterial({ color: 0xff5050 });
    const feixe = new THREE.Mesh(gFeixe, matFeixe);
    const brilho = new THREE.Mesh(gBrilho, matBrilho);
    const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 14, 12), matPonto);
    [feixe, brilho, ponto].forEach((o) => { o.userData = { semSombra: true, ignorarClique: true }; o.position.set(X_LASER, Y_ESTEIRA, Z_L); });
    add(feixe, brilho, ponto);
    ctx.laser = { feixe, brilho, ponto, matFeixe };
    // anteparo no início da esteira (fundo que o laser enxerga sem peças)
    add(box(0.006, 0.07, 0.05, M.preto, X_FUNDO - 0.003, Y_ESTEIRA, 0.045));
    add(box(0.002, 0.03, 0.03, M.branco, X_FUNDO + 0.0005, Y_ESTEIRA, Z_L));

    parte('opticos');
    for (const x of [-0.29, -0.23, -0.17]) {
      add(box(0.05, 0.05, 0.004, M.aluEscuro, x, -0.03, 0.002));
      add(box(0.045, 0.032, 0.03, M.preto, x, -0.03, 0.019));
      const l = criarLed(0xff9a2e); l.position.set(x + 0.014, -0.014, 0.036); add(l);
      add(box(0.045, 0.05, 0.004, M.aluEscuro, x, 0.12, 0.002));
      add(box(0.045, 0.032, 0.03, M.preto, x, 0.12, 0.019));
      const l2 = criarLed(0xff9a2e); l2.position.set(x + 0.014, 0.104, 0.036); add(l2);
    }
    for (const y of [0.22, 0.185, 0.15]) add(box(0.034, 0.026, 0.024, M.cinzaClaro, -0.025, y, 0.012));

    /* ---- painel, torre, calhas de cabo ---- */
    parte('painel');
    add(box(0.15, 0.075, 0.035, M.creme, -0.225, 0.235, 0.0175));
    add(cil(0.008, 0.01, M.preto, 'z', -0.26, 0.24, 0.04));
    add(cil(0.008, 0.01, M.preto, 'z', -0.235, 0.215, 0.04));
    for (const dx of [-0.205, -0.19, -0.175]) add(box(0.008, 0.012, 0.01, M.preto, dx, 0.245, 0.04));
    add(box(0.03, 0.5, 0.035, M.cinza, -0.455, 0.03, 0.0175));
    for (let k = 0; k < 20; k += 1) add(box(0.032, 0.008, 0.0365, M.ranhura, -0.455, 0.27 - k * 0.025, 0.0175));

    parte('torre');
    add(cil(0.009, 0.012, M.preto, 'z', -0.155, 0.25, 0.041));
    const lamp = (cor, z) => {
      const m = std({ color: 0x333333, emissive: cor, emissiveIntensity: 0.08, roughness: 0.3 });
      const o = cil(0.0085, 0.016, m, 'z', -0.155, 0.25, z, 20);
      add(o);
      return o;
    };
    ctx.torre = { verde: lamp(0x30ff70, 0.055), amarelo: lamp(0xffc020, 0.0715), vermelho: lamp(0xff3030, 0.088) };
    add(cil(0.0075, 0.004, M.preto, 'z', -0.155, 0.25, 0.098));

    parte('valvulas');
    add(box(0.11, 0.06, 0.05, M.cinzaClaro, 0.37, -0.285, 0.025));
    for (const dx of [-0.035, -0.012, 0.012, 0.035]) add(box(0.016, 0.05, 0.018, M.azul, 0.37 + dx, -0.285, 0.059));
    add(cil(0.009, 0.03, M.preto, 'x', 0.435, -0.285, 0.03));

    parte('regulador');
    add(cil(0.018, 0.05, M.azul, 'z', 0.31, 0.235, 0.025));
    add(cil(0.02, 0.014, M.aluEscuro, 'z', 0.31, 0.235, 0.057));
    add(cil(0.028, 0.014, M.preto, 'z', 0.36, 0.245, 0.04));
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
    add(face);
    add(cil(0.018, 0.02, M.cinza, 'z', 0.40, -0.06, 0.01));
    add(cil(0.014, 0.05, M.cinzaClaro, 'z', 0.40, -0.06, 0.045));

    parte('coluna');
    add(box(0.07, 0.05, 0.02, M.aluEscuro, 0.43, 0.31, 0.01));
    add(cil(0.03, 0.30, M.vidro, 'z', 0.43, 0.31, 0.17));

    parte('terminais');
    add(box(0.33, 0.012, 0.008, M.aluEscuro, -0.27, -0.225, 0.004));
    for (let row = 0; row < 3; row += 1) {
      for (let i = 0; i < 26; i += 1) {
        const m = (i + row) % 7 === 0 ? M.laranja : (i % 5 === 0 ? M.cinzaClaro : M.cinza);
        add(box(0.0095, 0.022, 0.02, m, -0.425 + i * 0.0105, -0.205 - row * 0.034, 0.01));
      }
    }
    for (let i = 0; i < 7; i += 1) {
      add(box(0.012, 0.05, 0.026, M.azul, -0.15 + i * 0.0135, -0.265, 0.013));
      add(box(0.009, 0.026, 0.016, M.branco, -0.15 + i * 0.0135, -0.265, 0.034));
    }
    const fios = [
      [[-0.40, -0.195, 0.02], [-0.395, -0.15, 0.055], [-0.36, -0.125, 0.06], M.vermelho],
      [[-0.38, -0.195, 0.02], [-0.33, -0.12, 0.06], [-0.29, -0.05, 0.036], M.azul],
      [[-0.36, -0.195, 0.02], [-0.26, -0.1, 0.07], [-0.23, -0.05, 0.036], M.verde],
      [[-0.34, -0.195, 0.02], [-0.2, -0.13, 0.065], [-0.17, -0.05, 0.036], M.branco],
      [[-0.42, -0.19, 0.02], [-0.45, -0.05, 0.05], [-0.46, 0.12, 0.05], M.verde],
      [[-0.41, -0.19, 0.02], [-0.42, -0.15, 0.09], [-0.362, -0.13, 0.108], M.cinza],
      [[-0.30, -0.195, 0.02], [-0.14, -0.15, 0.07], [-0.073, -0.08, 0.03], M.vermelho],
    ];
    fios.forEach(([a, b, c, m]) => add(tubo([a, b, c], 0.0028, m)));
    add(tubo([[0.36, -0.26, 0.05], [0.25, -0.24, 0.085], [0.20, -0.19, 0.045]], 0.0042, M.tubo));
    add(tubo([[0.34, -0.27, 0.05], [0.2, -0.26, 0.09], [0.10, -0.19, 0.045]], 0.0042, M.tubo));
    add(tubo([[0.40, -0.26, 0.05], [0.452, -0.1, 0.06], [0.452, 0.15, 0.06], [0.36, 0.22, 0.05]], 0.0042, M.tubo));

    /* ---- calhas e separadores pneumáticos ---- */
    ESTACOES_X.forEach((x, i) => {
      parte(`calha${i + 1}`);
      add(box(0.074, 0.25, 0.012, M.alu, x, 0.215, 0.034));
      for (const s of [-1, 1]) add(box(0.006, 0.25, 0.034, M.aluEscuro, x + s * 0.0385, 0.215, 0.05));
      add(box(0.07, 0.008, 0.03, M.aluEscuro, x, 0.343, 0.05));

      parte(`separador${i + 1}`);
      add(cil(0.0125, 0.1, M.aluEscuro, 'y', x, -0.13, 0.04));
      add(cil(0.0135, 0.012, M.azul, 'y', x, -0.18, 0.04));
      add(box(0.034, 0.03, 0.01, M.cinza, x, -0.12, 0.01));
      add(box(0.008, 0.02, 0.008, M.preto, x + 0.0145, -0.14, 0.04));
      const haste = cil(0.0042, 1, M.aco, 'y', x, 0, 0.04, 12);
      const c = cunha();
      c.position.x = x;
      add(haste, c);
      ctx.estacoes.push({ x, e: 0, estado: 'idle', haste, cunha: c, base: -0.045 });
    });
    atualizarEstacoes(ctx, 0);
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
      this.totais = [0, 0];
      this.contagem = 0;
      this.distMm = (X_LASER - X_FUNDO) * 1000;
      this.tempo = 0;
      this.rodandoApi = true;
      this.manual = null; // true/false = botão da tela; null = segue a API
      this.estado = { ind: false, cap: false, dist: false, distMm: this.distMm, rodando: true, filas: [0, 0], totais: [0, 0], contagem: 0, sep: [false, false, false] };
      this.ctx = { root: this.root, partes: {}, leds: {}, estacoes: [], texCorreia: null, laser: null, torre: null };
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
      const renderer = this.el.sceneEl.renderer;
      try {
        if (renderer) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          const env = criarAmbiente(renderer);
          Object.values(M).forEach((m) => { m.envMap = env; m.envMapIntensity = 1.1; m.needsUpdate = true; });
          this.root.traverse((o) => {
            if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.material.envMap) {
              o.material.envMap = env; o.material.envMapIntensity = 1.1; o.material.needsUpdate = true;
            }
          });
        }
      } catch (e) {
        console.warn('Reflexos desativados:', e);
      }
      this.root.traverse((o) => {
        if (o.isMesh && !(o.userData && o.userData.semSombra)) { o.castShadow = true; o.receiveShadow = true; }
      });
      const sol = new THREE.DirectionalLight(0xffffff, LUZ_DIRECIONAL);
      sol.position.set(0.5, -0.7, 1.3);
      sol.castShadow = true;
      sol.shadow.mapSize.set(2048, 2048);
      const c = sol.shadow.camera;
      c.left = -0.9; c.right = 0.9; c.top = 0.9; c.bottom = -0.9; c.near = 0.1; c.far = 4;
      sol.shadow.bias = -0.0004;
      this.root.add(sol);
      this.root.add(new THREE.HemisphereLight(0xdfe9f5, 0x40474f, LUZ_AMBIENTE));
    },

    // API de dados (vem do back-end) e botão da tela
    setRodando(v) { this.rodandoApi = !!v; },
    forcarRodando(v) { this.manual = v; },
    estaRodando() { return this.manual !== null ? this.manual : this.rodandoApi; },

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

    getEstado() { return this.estado; },

    tick(_t, dtMs) {
      try { this.passo(dtMs); } catch (e) { if (!this.avisou) { console.error('Gêmeo 3D:', e); this.avisou = true; } }
    },

    passo(dtMs) {
      const dt = Math.min((dtMs || 16) / 1000, 0.05);
      this.tempo += dt;
      const rodando = this.estaRodando();
      const { estacoes, leds, texCorreia, laser, torre } = this.ctx;
      if (rodando && texCorreia) texCorreia.offset.x -= VEL * 24.3 * dt;

      for (const p of [...this.pecas]) {
        if (p.estado === 'esteira') {
          if (rodando) p.x += VEL * dt;
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
          if (p.y >= p.yFinal) { p.estado = 'guardada'; this.totais[p.alvo] += 1; }
        }
        p.mesh.position.set(p.x, p.y, Z_PECA);
      }
      atualizarEstacoes(this.ctx, dt);

      // Sensores: LEDs e laser seguem as peças
      let ind = false;
      let cap = false;
      let alcance = X_LASER - X_FUNDO;
      let acertouPeca = false;
      for (const p of this.pecas) {
        if (p.estado !== 'esteira' && p.estado !== 'empurrando') continue;
        if (p.tipo === 'METALICA' && Math.abs(p.x - X_IND) < 0.04) ind = true;
        if (Math.abs(p.x - X_CAP) < 0.045) cap = true;
        const dy = Math.abs(p.y - Y_ESTEIRA);
        if (dy < RAIO) {
          const d = X_LASER - (p.x + Math.sqrt(RAIO * RAIO - dy * dy)); // face da peça voltada ao sensor
          if (d > 0 && d < alcance) { alcance = d; acertouPeca = true; }
          if (d > 0 && d < ALCANCE_CONTAGEM && !p.contada) { p.contada = true; this.contagem += 1; }
        }
      }
      if (laser) {
        laser.feixe.scale.x = alcance; laser.feixe.position.x = X_LASER - alcance / 2;
        laser.brilho.scale.x = alcance; laser.brilho.position.x = X_LASER - alcance / 2;
        laser.ponto.position.x = X_LASER - alcance;
        laser.matFeixe.opacity = 0.85 + 0.1 * Math.sin(this.tempo * 40);
      }
      this.distMm += (alcance * 1000 - this.distMm) * Math.min(1, dt * 25);

      if (leds.ind) { ligar(leds.ind, ind); ligar(leds.cap, cap); ligar(leds.dist, acertouPeca, 3); }
      const algumAtuando = estacoes.some((s) => s.estado !== 'idle');
      if (torre) {
        ligar(torre.verde, rodando, 3);
        ligar(torre.vermelho, !rodando, 3);
        ligar(torre.amarelo, algumAtuando, 3);
      }

      const e = this.estado;
      e.ind = ind; e.cap = cap; e.dist = acertouPeca; e.distMm = this.distMm; e.rodando = rodando;
      e.filas[0] = this.filas[0].length; e.filas[1] = this.filas[1].length;
      e.totais[0] = this.totais[0]; e.totais[1] = this.totais[1];
      e.contagem = this.contagem;
      e.sep[0] = estacoes[0] ? estacoes[0].estado !== 'idle' : false;
      e.sep[1] = estacoes[1] ? estacoes[1].estado !== 'idle' : false;
      e.sep[2] = estacoes[2] ? estacoes[2].estado !== 'idle' : false;
    },
  });
})();
