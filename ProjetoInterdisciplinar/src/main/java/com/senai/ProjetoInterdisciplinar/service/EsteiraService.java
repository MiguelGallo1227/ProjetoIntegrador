package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.DTO.EsteiraStatusDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraDTO;
import com.senai.ProjetoInterdisciplinar.DTO.PortaLeituraDTO;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EsteiraService {

    private static final int LIMITE_MAXIMO = 1000;

    private final LeituraRepository repository;
    private final ColetaService coleta;
    private final IoLinkProperties props;
    private final IoLinkClient client;
    private final IoLinkDecoder decoder;

    @Value("${app.esteira.id:ESTEIRA-01}")
    private String esteiraId;

    @Value("${app.esteira.nome:Esteira de triagem 01}")
    private String esteiraNome;

    public EsteiraStatusDTO status() {
        Instant inicioDoDia = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        long metalicas = repository.countByTipoPecaAndDataHoraGreaterThanEqual(TipoPeca.METALICA, inicioDoDia);
        long naoMetalicas = repository.countByTipoPecaAndDataHoraGreaterThanEqual(TipoPeca.NAO_METALICA, inicioDoDia);

        Instant ultimaColeta = coleta.getUltimaColetaOk();
        boolean operando = ultimaColeta != null
                && Duration.between(ultimaColeta, Instant.now()).toMillis() <= props.getOfflineAposMs();

        Leitura ultima = repository.findFirstByOrderByDataHoraDesc().orElse(null);
        Instant ultimaLeitura = ultima != null ? ultima.getDataHora()
                : ultimaColeta != null ? ultimaColeta : Instant.now();

        double nivel = coleta.getNivelAtual() != null ? coleta.getNivelAtual()
                : ultima != null ? ultima.getNivelReservatorio() : 0.0;

        return EsteiraStatusDTO.builder()
                .esteiraId(esteiraId)
                .nome(esteiraNome)
                .operando(operando)
                .ultimaLeitura(ultimaLeitura)
                .totalMetalicas(metalicas)
                .totalNaoMetalicas(naoMetalicas)
                .nivelReservatorio(nivel)
                .build();
    }

    /** Ultimas leituras em ordem cronologica crescente (como o dashboard espera). */
    public List<LeituraDTO> leituras(int limite) {
        int n = Math.min(Math.max(limite, 1), LIMITE_MAXIMO);
        List<Leitura> recentes = new ArrayList<>(repository.findAllByOrderByDataHoraDesc(PageRequest.of(0, n)));
        Collections.reverse(recentes);
        return recentes.stream().map(LeituraDTO::de).toList();
    }

    /** Le as portas agora, sem salvar nada. Serve para conferir a configuracao dos sensores. */
    public List<PortaLeituraDTO> portasAoVivo() {
        return props.getPortas().stream().map(this::lerPorta).toList();
    }

    private PortaLeituraDTO lerPorta(Porta p) {
        var b = PortaLeituraDTO.builder()
                .porta(p.getNumero())
                .nome(p.getNome())
                .funcao(p.getFuncao());
        try {
            String hex = client.lerPdin(p.getNumero());
            byte[] dados = decoder.hexParaBytes(hex);
            b.disponivel(true).hex(hex);
            if (p.getFuncao() == FuncaoPorta.NIVEL_RESERVATORIO) {
                b.nivelPercentual(decoder.nivelPercentual(dados, p));
            } else {
                b.ativo(decoder.estadoAtivo(dados, p));
            }
        } catch (RuntimeException e) {
            b.disponivel(false).erro(e.getMessage());
        }
        return b.build();
    }
}
