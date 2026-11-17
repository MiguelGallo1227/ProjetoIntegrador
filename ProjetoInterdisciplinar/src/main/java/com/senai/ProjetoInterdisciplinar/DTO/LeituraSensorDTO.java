package com.senai.ProjetoInterdisciplinar.DTO;

import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import com.senai.ProjetoInterdisciplinar.entity.LeituraSensor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** Item de GET /api/iolink/historico. */
@Getter
@Builder
public class LeituraSensorDTO {
    private final Long id;
    private final Instant timestamp;
    private final int porta;
    private final FuncaoPorta funcao;
    private final String hex;
    private final Long valorBruto;
    private final Boolean ativo;
    private final Double nivelPercentual;

    public static LeituraSensorDTO de(LeituraSensor l) {
        return LeituraSensorDTO.builder()
                .id(l.getId())
                .timestamp(l.getDataHora())
                .porta(l.getPorta())
                .funcao(l.getFuncao())
                .hex(l.getHex())
                .valorBruto(l.getValorBruto())
                .ativo(l.getAtivo())
                .nivelPercentual(l.getNivelPercentual())
                .build();
    }
}
