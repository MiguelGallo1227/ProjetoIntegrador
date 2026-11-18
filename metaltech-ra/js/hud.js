// Interface do modo PC: controle da câmera, legendas ligáveis, seleção de peças e painéis de dados.
(() => {
  window.RA_V = window.RA_V || {};
  window.RA_V.hud = 6;
  const THREE = AFRAME.THREE;
  const DEG = Math.PI / 180;
  const VISTAS = {
    iso: { rx: -52, rz: -28, zoom: 1.15 },
    topo: { rx: 0, rz: 0, zoom: 1.0 },
    frontal: { rx: -74, rz: 0, zoom: 0.95 },
  };

  /* ------------------------------------------------ câmera: arrastar, zoom, vistas */
  AFRAME.registerComponent('drag-rotate', {
    init() {
      this.rx = VISTAS.iso.rx; this.rz = VISTAS.iso.rz; this.zoom = VISTAS.iso.zoom;
      this.auto = false; this.anim = null; this.ultimo = null; this.inicio = null;
      this.el.object3D.rotation.order = 'XYZ';
      this.aplicar();
      this.el.sceneEl.addEventListener('loaded', () => this.aplicar());
      window.addEventListener('pointerdown', (e) => {
        if (e.target.closest && e.target.closest('.ui')) return;
        this.ultimo = [e.clientX, e.clientY]; this.inicio = [e.clientX, e.clientY]; this.anim = null;
      });
      window.addEventListener('pointerup', (e) => {
        if (!this.ultimo) return;
        const mexeu = Math.hypot(e.clientX - this.inicio[0], e.clientY - this.inicio[1]);
        if (mexeu < 5) window.dispatchEvent(new CustomEvent('gemeo-clique', { detail: { x: e.clientX, y: e.clientY } }));
        this.ultimo = null;
      });
      window.addEventListener('pointermove', (e) => {
        if (!this.ultimo) return;
        this.rz += (e.clientX - this.ultimo[0]) * 0.35;
        this.rx = Math.max(-88, Math.min(0, this.rx + (e.clientY - this.ultimo[1]) * 0.3));
        this.ultimo = [e.clientX, e.clientY];
        this.aplicar();
      });
      window.addEventListener('wheel', (e) => {
        if (e.target.closest && e.target.closest('.ui')) return;
        this.zoom = Math.max(0.45, Math.min(2.5, this.zoom + e.deltaY * 0.001));
        this.aplicar();
      }, { passive: true });
    },
    aplicar() {
      this.el.object3D.rotation.set(this.rx * DEG, 0, this.rz * DEG);
      const cam = document.querySelector('a-camera');
      if (cam && cam.object3D) cam.object3D.position.z = this.zoom;
    },
    irPara(v) {
      let dz = v.rz - this.rz;
      dz = ((dz + 180) % 360 + 360) % 360 - 180; // caminho mais curto
      this.anim = { t: 0, de: { rx: this.rx, rz: this.rz, zoom: this.zoom }, drx: v.rx - this.rx, drz: dz, dzoom: v.zoom - this.zoom };
    },
    tick(_t, dt) {
      try { this.passo(dt); } catch (e) { if (!this.avisou) { console.error(e); this.avisou = true; } }
    },
    passo(dt) {
      if (this.anim) {
        this.anim.t = Math.min(1, this.anim.t + dt / 800);
        const k = this.anim.t < 0.5 ? 2 * this.anim.t * this.anim.t : 1 - Math.pow(-2 * this.anim.t + 2, 2) / 2;
        this.rx = this.anim.de.rx + this.anim.drx * k;
        this.rz = this.anim.de.rz + this.anim.drz * k;
        this.zoom = this.anim.de.zoom + this.anim.dzoom * k;
        if (this.anim.t >= 1) this.anim = null;
        this.aplicar();
      } else if (this.auto && !this.ultimo) {
        this.rz += dt * 0.008;
        this.aplicar();
      }
    },
  });

  AFRAME.registerComponent('hud-loop', {
    tick(t, dt) { if (window.RA_HUD_LOOP) window.RA_HUD_LOOP(t, dt); },
  });

  /* ------------------------------------------------ legendas */
  const SENSORES = ['indutivo', 'capacitivo', 'distancia'];
  const LEG = [
    { id: 'indutivo', t: 'Sensor indutivo (embaixo)', p: [-0.36, -0.04, 0.058], d: [-140, 75], v: (e) => (e.ind ? 'Metal detectado' : 'Livre') },
    { id: 'capacitivo', t: 'Sensor capacitivo (em cima)', p: [-0.36, -0.04, 0.105], d: [-140, -45], v: (e) => (e.cap ? 'Material detectado' : 'Livre') },
    { id: 'distancia', t: 'Sensor de distância (laser)', p: [0.40, 0.041, 0.085], d: [30, -80], v: (e) => `${Math.round(e.distMm)} mm` },
  ];
  const INFO_LIVE = {
    indutivo: (e) => (e.ind ? 'Estado: metal detectado' : 'Estado: livre'),
    capacitivo: (e) => (e.cap ? 'Estado: material detectado' : 'Estado: livre'),
    distancia: (e) => `Leitura: ${Math.round(e.distMm)} mm · peças contadas: ${e.contagem}`,
  };

  const hexLabel = (raw, v) => (typeof raw === 'string' ? raw : v === null || v === undefined ? '–' : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`);
  const $ = (s) => document.querySelector(s);

  function montar() {
    const cena = $('a-scene');
    const alvo = $('#target');
    const gemeoEl = $('#gemeo');
    const twin = () => (gemeoEl && gemeoEl.components ? gemeoEl.components['gemeo-3d'] : null);
    const rot = () => alvo.components['drag-rotate'];

    /* legendas: pílulas HTML + linhas SVG ligadas a pontos 3D */
    const cont = $('#legendas');
    const svg = $('#ligacoes');
    LEG.forEach((l) => {
      l.el = document.createElement('div');
      l.el.className = 'leg ui';
      l.el.innerHTML = `<b>${l.t}</b><span class="v"></span>`;
      l.el.addEventListener('click', () => selecionar(l.id));
      cont.appendChild(l.el);
      l.linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.ponto = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      l.ponto.setAttribute('r', '4');
      svg.append(l.linha, l.ponto);
      l.vEl = l.el.querySelector('.v');
    });

    /* seleção de componentes */
    let helper = null;
    let selId = null;
    function selecionar(id) {
      if (helper) { cena.object3D.remove(helper); helper = null; }
      selId = id && SENSORES.includes(id) && twin() && twin().ctx.partes[id] ? id : null;
      LEG.forEach((l) => l.el.classList.toggle('sel', l.id === selId));
      const info = $('#info');
      if (!selId) { info.hidden = true; return; }
      const g = twin().ctx.partes[selId];
      helper = new THREE.BoxHelper(g, 0xe0a21a);
      cena.object3D.add(helper);
      $('#info-t').textContent = g.userData.titulo;
      $('#info-d').textContent = g.userData.desc;
      info.hidden = false;
    }
    $('#info-x').addEventListener('click', () => selecionar(null));

    window.addEventListener('gemeo-clique', (ev) => {
      const t = twin();
      const cam = cena.camera;
      if (!t || !cam) return;
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2((ev.detail.x / window.innerWidth) * 2 - 1, -(ev.detail.y / window.innerHeight) * 2 + 1), cam);
      const acertos = rc.intersectObject(t.root, true);
      for (const h of acertos) {
        if ((h.object.userData && h.object.userData.ignorarClique) || (h.object.material && h.object.material.transparent)) continue;
        let o = h.object;
        while (o && !(o.userData && o.userData.id)) o = o.parent;
        if (o) { selecionar(o.userData.id); return; }
      }
      selecionar(null);
    });

    /* barra de ferramentas */
    const bLeg = $('#b-leg');
    bLeg.addEventListener('click', () => {
      const on = document.body.classList.toggle('sem-legendas');
      bLeg.classList.toggle('on', !on);
      bLeg.setAttribute('aria-pressed', String(!on));
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') bLeg.click();
      else if (e.key === 'Escape') selecionar(null);
    });

    /* dados do back-end/mock (vêm do app.js) */
    window.RA_HUD = {
      dados(d) {
        const s = d.status;
        const m = s && s.totalMetalicas !== undefined ? s.totalMetalicas : null;
        const n = s && s.totalNaoMetalicas !== undefined ? s.totalNaoMetalicas : null;
        $('#k-m').textContent = m === null ? '–' : m;
        $('#k-n').textContent = n === null ? '–' : n;
        $('#k-t').textContent = m === null || n === null ? '–' : m + n;
        const chip = $('#chip-op');
        chip.textContent = d.erro ? 'Sem conexão com a API' : s ? (s.operando ? 'Operando' : 'Parada') : 'Carregando…';
        chip.className = `chip ${d.erro ? 'erro' : s && s.operando ? 'ok' : 'neutro'}`;
        const l = d.leitura;
        $('#a-ind').textContent = `Último valor da API: ${l ? hexLabel(l.raw.indutivo, l.indutivo) : '–'}`;
        $('#a-cap').textContent = `Último valor da API: ${l ? hexLabel(l.raw.capacitivo, l.capacitivo) : '–'}`;
        $('#a-dist').textContent = `Último valor da API: ${l ? hexLabel(l.raw.distancia, l.distancia) : '–'}`;
      },
    };

    /* laço por quadro: posiciona legendas e atualiza valores ao vivo (10 Hz) */
    const v3 = new THREE.Vector3();
    let acumulado = 0;
    let avisouLoop = false;
    window.RA_HUD_LOOP = (_t, dt) => {
      try { laco(dt); } catch (e) { if (!avisouLoop) { console.error('HUD:', e); avisouLoop = true; } }
    };
    const laco = (dt) => {
      const cam = cena.camera;
      const t = twin();
      if (!cam || !t) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      gemeoEl.object3D.updateWorldMatrix(true, false);
      const visivel = !document.body.classList.contains('sem-legendas');
      if (visivel) {
        for (const l of LEG) {
          v3.set(l.p[0], l.p[1], l.p[2]);
          gemeoEl.object3D.localToWorld(v3);
          v3.project(cam);
          const ok = v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15;
          l.el.style.display = ok ? '' : 'none';
          l.linha.style.display = ok ? '' : 'none';
          l.ponto.style.display = ok ? '' : 'none';
          if (!ok) continue;
          const sx = (v3.x * 0.5 + 0.5) * W;
          const sy = (-v3.y * 0.5 + 0.5) * H;
          const px = sx + l.d[0];
          const py = sy + l.d[1];
          l.el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
          l.linha.setAttribute('x1', sx); l.linha.setAttribute('y1', sy);
          l.linha.setAttribute('x2', px); l.linha.setAttribute('y2', py);
          l.ponto.setAttribute('cx', sx); l.ponto.setAttribute('cy', sy);
        }
      }
      if (helper) helper.update();

      acumulado += dt;
      if (acumulado < 100) return;
      acumulado = 0;
      const e = t.getEstado();
      if (visivel) for (const l of LEG) l.vEl.textContent = l.v(e);
      $('#v-ind').textContent = e.ind ? 'Metal detectado' : 'Livre';
      $('#v-cap').textContent = e.cap ? 'Material detectado' : 'Livre';
      $('#c-ind').classList.toggle('ativo', e.ind);
      $('#c-cap').classList.toggle('ativo', e.cap);
      $('#c-dist').classList.toggle('ativo', e.dist);
      $('#v-dist').textContent = Math.round(e.distMm);
      $('#g-dist').style.width = `${Math.max(0, Math.min(100, (e.distMm / 850) * 100))}%`;
      $('#v-cont').textContent = e.contagem;
      if (selId && INFO_LIVE[selId]) $('#info-v').textContent = INFO_LIVE[selId](e);
      else $('#info-v').textContent = '';
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cena = $('a-scene');
    if (cena.hasLoaded) montar();
    else cena.addEventListener('loaded', montar);
  });
})();
