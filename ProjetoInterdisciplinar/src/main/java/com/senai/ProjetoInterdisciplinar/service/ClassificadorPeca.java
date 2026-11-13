package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Classifica cada peca combinando o sensor indutivo e o capacitivo.
 *
 * O capacitivo detecta qualquer peca; o indutivo so detecta metal e e o que decide:
 * se o indutivo pegou em algum momento da passagem, a peca e METALICA; se so o capacitivo
 * pegou, e NAO_METALICA. A passagem comeca quando qualquer um dos dois ativa e termina
 * quando os dois ficam livres por pelo menos "fimAposMs".
 *
 * Protecao contra sensor travado: se a passagem durar mais que "maxPassagemMs" (sensor
 * sempre ativo, peca parada na frente dele, limiar errado), ela e encerrada e contada, e
 * o classificador so volta a aceitar pecas depois que os dois sensores ficarem livres.
 */
@Slf4j
@Component
public class ClassificadorPeca {

    private boolean passando;
    private boolean aguardandoLiberar;
    private boolean indutivoPegou;
    private Instant inicioPassagem;
    private Instant ultimaAtividade;

    /** Chamar a cada ciclo de leitura. Devolve o tipo quando uma peca termina de passar. */
    public Optional<TipoPeca> atualizar(boolean indutivoAtivo, boolean capacitivoAtivo,
                                        Instant agora, long fimAposMs, long maxPassagemMs) {
        boolean algumAtivo = indutivoAtivo || capacitivoAtivo;

        if (aguardandoLiberar) {
            if (!algumAtivo) {
                aguardandoLiberar = false;
                log.info("Sensores livres de novo, voltando a contar pecas");
            }
            return Optional.empty();
        }

        if (algumAtivo) {
            if (!passando) {
                passando = true;
                indutivoPegou = false;
                inicioPassagem = agora;
            }
            if (indutivoAtivo) {
                indutivoPegou = true;
            }
            ultimaAtividade = agora;

            if (Duration.between(inicioPassagem, agora).toMillis() >= maxPassagemMs) {
                log.warn("Sensor ativo ha mais de {} ms (indutivo={}, capacitivo={}): peca contada e "
                                + "novas pecas so depois que os sensores ficarem livres. Confira os limiares.",
                        maxPassagemMs, indutivoAtivo, capacitivoAtivo);
                passando = false;
                aguardandoLiberar = true;
                return Optional.of(tipoDaPassagem());
            }
            return Optional.empty();
        }

        if (passando && Duration.between(ultimaAtividade, agora).toMillis() >= fimAposMs) {
            passando = false;
            return Optional.of(tipoDaPassagem());
        }
        return Optional.empty();
    }

    private TipoPeca tipoDaPassagem() {
        return indutivoPegou ? TipoPeca.METALICA : TipoPeca.NAO_METALICA;
    }
}
