// Configuracoes da RA. Ajuste aqui sem mexer no resto do codigo.
window.RA_CONFIG = {
  // true = dados simulados (para testar a RA sem o back-end)
  USE_MOCK: true,
  // URL base da API REST (mesma usada pelo dashboard React)
  API_URL: 'http://localhost:8080',
  // atualizacao dos dados (segundos)
  INTERVALO: 3,

  // Proporcao da foto usada como target (assets/images/target.jpg = 1024 x 768)
  TARGET_WIDTH: 1024,
  TARGET_HEIGHT: 768,

  // Trajeto das pecas 3D sobre a esteira (fracao da foto) e tempo da travessia (ms)
  BELT: { u1: 0.10, u2: 0.84, v: 0.445, DURACAO: 6000 },

  // Onde cada sensor fica na FOTO, em fracao da imagem: u = 0 (esquerda) a 1 (direita),
  // v = 0 (topo) a 1 (base). Ajuste ate o marcador cair em cima do sensor real.
  ANCHORS: {
    indutivo:   { u: 0.156, v: 0.347 },
    capacitivo: { u: 0.131, v: 0.530 },
    distancia:  { u: 0.427, v: 0.560 },
  },
};
