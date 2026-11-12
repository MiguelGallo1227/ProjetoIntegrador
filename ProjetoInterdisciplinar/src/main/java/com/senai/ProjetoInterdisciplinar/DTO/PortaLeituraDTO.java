package com.senai.ProjetoInterdisciplinar.DTO;

import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import lombok.Builder;
import lombok.Getter;

/** Leitura ao vivo de uma porta (GET /api/iolink/portas), util para calibrar os sensores. */
@Getter
@Builder
public class PortaLeituraDTO {
    private final int porta;
    private final String nome;
    private final FuncaoPorta funcao;
    private final boolean disponivel;
    /** Process data bruto em hexadecimal. */
    private final String hex;
    /** Preenchido para sensores de peca. */
    private final Boolean ativo;
    /** Preenchido para o sensor de nivel (0..100). */
    private final Double nivelPercentual;
    private final String erro;
}
