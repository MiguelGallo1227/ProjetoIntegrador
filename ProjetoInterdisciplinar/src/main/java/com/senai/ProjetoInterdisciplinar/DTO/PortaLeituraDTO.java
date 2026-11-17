package com.senai.ProjetoInterdisciplinar.DTO;

import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** Ultima leitura de uma porta do mestre IO-Link (GET /api/iolink/portas). */
@Getter
@Builder
public class PortaLeituraDTO {
    private final int porta;
    private final String nome;
    private final FuncaoPorta funcao;
    private final boolean disponivel;
    /** Process data bruto em hexadecimal, exatamente como veio do mestre. */
    private final String hex;
<<<<<<< HEAD
    /** Resposta original da API do sensor (resumida), para conferir o formato. */
    private final String resposta;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    /** O mesmo dado em binario (bit 0 = o mais a direita de cada byte). */
    private final String binario;
    /** Sensor de peca: true = detectando. */
    private final Boolean ativo;
    /** Sensor de distancia/nivel: valor bruto em decimal (ex.: distancia em mm). */
    private final Long valorBruto;
<<<<<<< HEAD
    /** Sensor com "delta": valor aprendido para a esteira livre. */
    private final Double linhaBase;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    /** Sensor de nivel: 0..100 %. */
    private final Double nivelPercentual;
    private final String erro;
    private final Instant atualizadoEm;
}
