package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.DTO.PortaLeituraDTO;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.LeituraSensor;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraRepository;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraSensorRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consulta as portas do mestre IO-Link em intervalo fixo e guarda a ultima leitura de cada uma.
 * A cada peca que termina de passar, o ClassificadorPeca decide entre metalica (indutivo pegou)
 * e nao metalica (so o capacitivo pegou); a peca vira uma Leitura no banco com o nivel do
 * reservatorio daquele momento.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ColetaService {

    private final IoLinkProperties props;
    private final IoLinkClient client;
    private final IoLinkDecoder decoder;
    private final LeituraRepository repository;
    private final LeituraSensorRepository sensorRepository;
    private final ClassificadorPeca classificador;

    // usados so pela thread do @Scheduled
    private final Set<Integer> portasComFalha = new HashSet<>();
    private final Map<Integer, String> ultimoHexSalvo = new HashMap<>();
    private final Map<Integer, Instant> ultimoSalvoEm = new HashMap<>();

    /** Ultima leitura de cada porta (numero -> leitura), atualizada a cada ciclo. */
    private final Map<Integer, PortaLeituraDTO> ultimasLeituras = new ConcurrentHashMap<>();

    /** Instante da ultima vez que pelo menos uma porta respondeu. */
    @Getter
    private volatile Instant ultimaColetaOk;

    /** Ultimo nivel do reservatorio lido (0..100). */
    @Getter
    private volatile Double nivelAtual;

    public List<PortaLeituraDTO> getUltimasLeituras() {
        return ultimasLeituras.values().stream()
                .sorted(Comparator.comparingInt(PortaLeituraDTO::getPorta))
                .toList();
    }

    @Scheduled(fixedDelayString = "${iolink.intervalo-ms:200}")
    public void coletar() {
        List<TipoPeca> pecasDetectadas = new ArrayList<>();
        boolean algumaOk = false;
        Boolean indutivo = null;   // null = nao leu neste ciclo
        Boolean capacitivo = null;

        for (Porta p : props.getPortas()) {
            try {
                String hex = client.lerPdin(p.getNumero());
                byte[] dados = decoder.hexParaBytes(hex);
                algumaOk = true;
                if (portasComFalha.remove(p.getNumero())) {
                    log.info("Porta {} voltou a responder", p.getNumero());
                }

                switch (p.getFuncao()) {
                    case NIVEL_RESERVATORIO -> {
                        double pct = decoder.nivelPercentual(dados, p);
                        nivelAtual = pct;
                        guardar(p, hex, dados, null, pct, decoder.valorBruto(dados, p), null);
                    }
                    case SENSOR_INDUTIVO -> {
                        indutivo = decoder.estadoAtivo(dados, p);
                        guardar(p, hex, dados, indutivo, null, brutoSensor(dados, p), null);
                    }
                    case SENSOR_CAPACITIVO -> {
                        capacitivo = decoder.estadoAtivo(dados, p);
                        guardar(p, hex, dados, capacitivo, null, brutoSensor(dados, p), null);
                    }
                }
            } catch (RuntimeException e) {
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                guardar(p, null, null, null, null, null, msg);
                if (portasComFalha.add(p.getNumero())) {
                    log.warn("Porta {} sem leitura: {}", p.getNumero(), msg);
                }
            }
        }

        Instant agora = Instant.now();
        if (algumaOk) {
            ultimaColetaOk = agora;
        }

        // so classifica quando os dois sensores foram lidos neste ciclo, para nao errar o tipo
        if (indutivo != null && capacitivo != null) {
            classificador.atualizar(indutivo, capacitivo, agora, props.getFimPecaMs(), props.getMaxPecaMs())
                    .ifPresent(pecasDetectadas::add);
        }

        // o nivel e lido antes de salvar, para a leitura da peca ja sair com o nivel certo
        double nivel = nivelAtual != null ? nivelAtual : 0.0;
        for (TipoPeca tipo : pecasDetectadas) {
            try {
                Leitura salva = repository.save(Leitura.builder()
                        .dataHora(agora)
                        .tipoPeca(tipo)
                        .nivelReservatorio(nivel)
                        .build());
                log.info("Peca {} detectada e gravada (id {}, nivel {}%)", tipo, salva.getId(), nivel);
            } catch (RuntimeException e) {
                log.error("Peca {} detectada, mas nao foi possivel gravar no banco: {}", tipo, e.getMessage());
            }
        }
    }

    /** Valor analogico do sensor de peca (para mostrar na tela); null se ele manda so um bit. */
    private Long brutoSensor(byte[] dados, Porta p) {
        return p.getLimiar() != null ? decoder.valorBruto(dados, p) : null;
    }

    private void guardar(Porta p, String hex, byte[] dados, Boolean ativo, Double nivel, Long bruto, String erro) {
        ultimasLeituras.put(p.getNumero(), PortaLeituraDTO.builder()
                .porta(p.getNumero())
                .nome(p.getNome())
                .funcao(p.getFuncao())
                .disponivel(erro == null)
                .hex(hex)
                .binario(dados != null ? decoder.binario(dados) : null)
                .ativo(ativo)
                .valorBruto(bruto)
                .nivelPercentual(nivel)
                .erro(erro)
                .atualizadoEm(Instant.now())
                .build());
        if (erro == null) {
            registrarHistorico(p, hex, ativo, nivel, bruto);
        }
    }

    /**
     * Grava no banco o que chegou da porta. O sensor de distancia e gravado a cada
     * iolink.historico-min-ms (padrao 10 s); os sensores de peca so entram aqui se
     * iolink.historico-sensores-peca=true (a contagem de pecas vai para a tabela "leitura").
     */
    private void registrarHistorico(Porta p, String hex, Boolean ativo, Double nivel, Long bruto) {
        boolean sensorNivel = p.getFuncao() == FuncaoPorta.NIVEL_RESERVATORIO;
        if (!sensorNivel && !props.isHistoricoSensoresPeca()) {
            return;
        }

        Instant agora = Instant.now();
        if (sensorNivel) {
            Instant ultimo = ultimoSalvoEm.get(p.getNumero());
            if (ultimo != null && Duration.between(ultimo, agora).toMillis() < props.getHistoricoMinMs()) {
                return;
            }
        } else if (hex.equalsIgnoreCase(ultimoHexSalvo.get(p.getNumero()))) {
            return; // sensor de peca: so grava quando o valor muda
        }

        try {
            sensorRepository.save(LeituraSensor.builder()
                    .dataHora(agora)
                    .porta(p.getNumero())
                    .funcao(p.getFuncao())
                    .hex(hex)
                    .valorBruto(bruto)
                    .ativo(ativo)
                    .nivelPercentual(nivel)
                    .build());
            ultimoHexSalvo.put(p.getNumero(), hex);
            ultimoSalvoEm.put(p.getNumero(), agora);
        } catch (RuntimeException e) {
            log.error("Nao foi possivel gravar a leitura da porta {} no banco: {}", p.getNumero(), e.getMessage());
        }
    }
}
