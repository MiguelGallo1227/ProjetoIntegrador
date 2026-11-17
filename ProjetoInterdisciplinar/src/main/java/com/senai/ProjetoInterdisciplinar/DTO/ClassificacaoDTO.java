package com.senai.ProjetoInterdisciplinar.DTO;

import lombok.Builder;
import lombok.Getter;

/** GET /api/classificar: a partir dos valores dos dois sensores, a peca e metalica ou nao? */
@Getter
@Builder
public class ClassificacaoDTO {
    /** METALICA, NAO_METALICA, LIVRE (nada na frente) ou SEM_DADOS. */
    private final String classificacao;
    /** Explicacao em uma frase de como se chegou nessa conclusao. */
    private final String motivo;
    /** AO_VIVO (ultimas leituras dos sensores) ou MANUAL (hex informado na chamada). */
    private final String origem;

    private final String indutivoHex;
    private final Long indutivoDecimal;
    private final Boolean indutivoAtivo;

    private final String capacitivoHex;
    private final Long capacitivoDecimal;
    private final Boolean capacitivoAtivo;
}
