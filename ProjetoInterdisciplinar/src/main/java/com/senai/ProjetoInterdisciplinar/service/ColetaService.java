package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Consulta as portas do mestre IO-Link em intervalo fixo. Uma peca e contada quando o
 * sensor dela passa de inativo para ativo (borda de subida); cada peca vira uma Leitura
 * com o nivel do reservatorio daquele momento.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ColetaService {

    private final IoLinkProperties props;
    private final IoLinkClient client;
    private final IoLinkDecoder decoder;
    private final LeituraRepository repository;

    // usados so pela thread do @Scheduled
    private final Map<Integer, Boolean> estadoAnterior = new HashMap<>();
    private final Set<Integer> portasComFalha = new HashSet<>();

    /** Instante da ultima vez que pelo menos uma porta respondeu. */
    @Getter
    private volatile Instant ultimaColetaOk;

    /** Ultimo nivel do reservatorio lido (0..100). */
    @Getter
    private volatile Double nivelAtual;

    @Scheduled(fixedDelayString = "${iolink.intervalo-ms:500}")
    public void coletar() {
        List<TipoPeca> pecasDetectadas = new ArrayList<>();
        boolean algumaOk = false;

        for (Porta p : props.getPortas()) {
            try {
                byte[] dados = decoder.hexParaBytes(client.lerPdin(p.getNumero()));
                algumaOk = true;
                if (portasComFalha.remove(p.getNumero())) {
                    log.info("Porta {} voltou a responder", p.getNumero());
                }

                switch (p.getFuncao()) {
                    case NIVEL_RESERVATORIO -> nivelAtual = decoder.nivelPercentual(dados, p);
                    case PECA_METALICA -> registrarBorda(p, dados, TipoPeca.METALICA, pecasDetectadas);
                    case PECA_NAO_METALICA -> registrarBorda(p, dados, TipoPeca.NAO_METALICA, pecasDetectadas);
                }
            } catch (RuntimeException e) {
                if (portasComFalha.add(p.getNumero())) {
                    log.warn("Porta {} sem leitura: {}", p.getNumero(), e.getMessage());
                }
            }
        }

        Instant agora = Instant.now();
        if (algumaOk) {
            ultimaColetaOk = agora;
        }

        // o nivel e lido antes de salvar, para a leitura da peca ja sair com o nivel certo
        double nivel = nivelAtual != null ? nivelAtual : 0.0;
        for (TipoPeca tipo : pecasDetectadas) {
            Leitura salva = repository.save(Leitura.builder()
                    .dataHora(agora)
                    .tipoPeca(tipo)
                    .nivelReservatorio(nivel)
                    .build());
            log.info("Peca {} detectada (id {}, nivel {}%)", tipo, salva.getId(), nivel);
        }
    }

    private void registrarBorda(Porta p, byte[] dados, TipoPeca tipo, List<TipoPeca> destino) {
        boolean ativo = decoder.estadoAtivo(dados, p);
        Boolean antes = estadoAnterior.put(p.getNumero(), ativo);
        // antes == null e a primeira leitura: so guarda o estado, nao conta peca
        if (antes != null && !antes && ativo) {
            destino.add(tipo);
        }
    }
}
