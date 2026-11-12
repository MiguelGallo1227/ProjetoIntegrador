package com.senai.ProjetoInterdisciplinar.DTO;

import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** Item de GET /api/leituras. */
@Getter
@Builder
public class LeituraDTO {
    private final Long id;
    private final Instant timestamp;
    private final TipoPeca tipoPeca;
    private final double nivelReservatorio;

    public static LeituraDTO de(Leitura l) {
        return LeituraDTO.builder()
                .id(l.getId())
                .timestamp(l.getDataHora())
                .tipoPeca(l.getTipoPeca())
                .nivelReservatorio(l.getNivelReservatorio())
                .build();
    }
}
