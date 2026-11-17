package com.senai.ProjetoInterdisciplinar.DTO;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** GET /api/diagnostico: diz se os dados estao chegando e se estao sendo gravados. */
@Getter
@Builder
public class DiagnosticoDTO {
    /** Resumo em uma frase do que esta acontecendo. */
    private final String veredito;
    private final Instant agora;
    /** Ultima vez que o ciclo de coleta rodou (prova que a coleta esta viva). */
    private final Instant ultimoCicloEm;
    /** Ultima vez que o mestre IO-Link respondeu. */
    private final Instant ultimaColetaOk;
    private final Long segundosSemReceber;
    /** Ultima gravacao bem-sucedida no banco. */
    private final Instant ultimaGravacaoOk;
    private final String ultimoErroBanco;
    private final Instant ultimoErroBancoEm;
    /** Duracao media de um ciclo de leitura (ms). */
    private final long cicloMedioMs;
    /** De quanto em quanto tempo os sensores sao olhados (ms): ciclo + intervalo. */
    private final long periodoAmostragemMs;
    private final long totalPecas;
    private final long totalLeiturasSensor;
    /** Uma peca esta na frente dos sensores agora. */
    private final boolean passando;
    /** Classificador esperando os sensores liberarem depois de um travamento. */
    private final boolean aguardandoLiberar;
}
