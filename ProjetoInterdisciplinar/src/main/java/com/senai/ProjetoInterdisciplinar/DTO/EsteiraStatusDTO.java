package com.senai.ProjetoInterdisciplinar.DTO;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** GET /api/esteira/status (contrato combinado com o dashboard). */
@Getter
@Builder
public class EsteiraStatusDTO {
    private final String esteiraId;
    private final String nome;
    private final boolean operando;
    private final Instant ultimaLeitura;
    private final long totalMetalicas;
    private final long totalNaoMetalicas;
    private final double nivelReservatorio;
}
