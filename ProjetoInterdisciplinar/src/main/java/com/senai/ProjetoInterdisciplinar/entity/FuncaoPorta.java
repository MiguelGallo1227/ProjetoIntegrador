package com.senai.ProjetoInterdisciplinar.entity;

/** O que o sensor ligado em cada porta do mestre IO-Link representa. */
public enum FuncaoPorta {
    /** Sensor de distancia no fim da esteira: nivel do reservatorio. */
    NIVEL_RESERVATORIO,
    /** Sensor indutivo (embaixo): so detecta metal. */
    SENSOR_INDUTIVO,
    /** Sensor capacitivo (em cima): detecta qualquer peca. */
    SENSOR_CAPACITIVO
}
