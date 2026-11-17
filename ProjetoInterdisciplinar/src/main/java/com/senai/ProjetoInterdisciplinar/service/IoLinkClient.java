package com.senai.ProjetoInterdisciplinar.service;

public interface IoLinkClient {

    /** Le o sensor da porta (numero configurado em iolink.portas[x].numero). */
    LeituraBruta lerPdin(int porta);
}
