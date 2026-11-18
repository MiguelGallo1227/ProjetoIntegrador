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

    private volatile boolean passando;
    private volatile boolean aguardandoLiberar;
    private boolean indutivoPegou;
    private volatile Instant inicioPassagem;
    private volatile Instant pausadoDesde;
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
                pausadoDesde = agora;
                return Optional.of(tipoDaPassagem());
            }
            return Optional.empty();
        }

        if (passando && Duration.between(ultimaAtividade, agora).toMillis() >= fimAposMs) {
            passando = false;
            TipoPeca tipo = tipoDaPassagem();
            log.info("Passagem de {} ms classificada como {}",
                    Duration.between(inicioPassagem, ultimaAtividade).toMillis(), tipo);
            return Optional.of(tipo);
        }
        return Optional.empty();
    }

    /** Desde quando a contagem esta pausada por sensor travado (null se nao esta). */
    public Instant getPausadoDesde() {
        return aguardandoLiberar ? pausadoDesde : null;
    }

    /**
     * A regra, para uma leitura so: indutivo pegou = METALICA; so o capacitivo pegou = NAO_METALICA;
     * nenhum dos dois = vazio (nada na frente).
     */
    public static Optional<TipoPeca> instantaneo(boolean indutivoAtivo, boolean capacitivoAtivo) {
        if (indutivoAtivo) {
            return Optional.of(TipoPeca.METALICA);
        }
        return capacitivoAtivo ? Optional.of(TipoPeca.NAO_METALICA) : Optional.empty();
    }

    /**
     * Segunda testemunha de metal. O indutivo tem alcance curto e, lido por HTTP, pode ser amostrado 0 ou 1
     * vez durante a peca, enquanto o capacitivo (alcance maior) e amostrado varias vezes. Se o valor mais
     * extremo do capacitivo na passagem chegou ao "limiarMetal", a peca e metalica de qualquer forma.
     * Nunca transforma METALICA em NAO_METALICA.
     *
     * @param picoCapacitivo valor mais extremo do capacitivo na passagem (null = nao amostrado)
     * @param limiarMetal    null = recurso desligado
     * @param invertido      true se a peca faz o valor do capacitivo cair
     */
    public static TipoPeca refinarPorAmplitude(TipoPeca tipo, Long picoCapacitivo, Double limiarMetal, boolean invertido) {
        if (tipo == TipoPeca.METALICA || limiarMetal == null || picoCapacitivo == null) {
            return tipo;
        }
        boolean metal = invertido ? picoCapacitivo <= limiarMetal : picoCapacitivo >= limiarMetal;
        return metal ? TipoPeca.METALICA : tipo;
    }

    public boolean isPassando() {
        return passando;
    }

    public boolean isAguardandoLiberar() {
        return aguardandoLiberar;
    }

    private TipoPeca tipoDaPassagem() {
        return indutivoPegou ? TipoPeca.METALICA : TipoPeca.NAO_METALICA;
    }
}
