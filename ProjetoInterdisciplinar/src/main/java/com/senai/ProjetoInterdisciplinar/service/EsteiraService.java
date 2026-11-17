package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.DTO.ClassificacaoDTO;
import com.senai.ProjetoInterdisciplinar.DTO.DiagnosticoDTO;
import com.senai.ProjetoInterdisciplinar.DTO.EsteiraStatusDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraSensorDTO;
import com.senai.ProjetoInterdisciplinar.DTO.PortaLeituraDTO;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraRepository;
import com.senai.ProjetoInterdisciplinar.repostory.LeituraSensorRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EsteiraService {

    private static final int LIMITE_MAXIMO = 1000;

    private final LeituraRepository repository;
    private final LeituraSensorRepository sensorRepository;
    private final ColetaService coleta;
<<<<<<< HEAD
    private final ClassificadorPeca classificador;
    private final IoLinkDecoder decoder;
    private final DetectorAnalogico detector;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    private final IoLinkProperties props;

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

    /** Historico do que chegou dos sensores, do mais recente para o mais antigo. */
    public List<LeituraSensorDTO> historico(Integer porta, int limite) {
        PageRequest pagina = PageRequest.of(0, Math.min(Math.max(limite, 1), LIMITE_MAXIMO));
        List<com.senai.ProjetoInterdisciplinar.entity.LeituraSensor> lista = porta == null
                ? sensorRepository.findAllByOrderByDataHoraDesc(pagina)
                : sensorRepository.findByPortaOrderByDataHoraDesc(porta, pagina);
        return lista.stream().map(LeituraSensorDTO::de).toList();
    }

    /** Ultima leitura de cada porta, atualizada continuamente pelo ColetaService. */
    public List<PortaLeituraDTO> portasAoVivo() {
        return coleta.getUltimasLeituras();
<<<<<<< HEAD
    }

    /** Responde: os dados estao chegando? estao sendo gravados? */
    public DiagnosticoDTO diagnostico() {
        Instant agora = Instant.now();
        Instant ciclo = coleta.getUltimoCicloEm();
        Instant ok = coleta.getUltimaColetaOk();
        Instant gravou = coleta.getUltimaGravacaoOk();
        Instant erroEm = coleta.getUltimoErroBancoEm();

        String veredito;
        if (ciclo == null || Duration.between(ciclo, agora).toSeconds() > 10) {
            veredito = "A coleta nao esta rodando: veja o log da aplicacao.";
        } else if (ok == null || Duration.between(ok, agora).toMillis() > props.getOfflineAposMs()) {
            veredito = "Nenhum dado chegando dos sensores: confira a rede e as URLs em iolink.portas[x].url (ou o IP " + props.getBaseUrl() + ").";
        } else if (erroEm != null && (gravou == null || erroEm.isAfter(gravou))) {
            veredito = "Os dados chegam, mas o banco recusou a gravacao: " + coleta.getUltimoErroBanco();
        } else if (classificador.isAguardandoLiberar()) {
            Instant desde = classificador.getPausadoDesde();
            String ha = desde != null ? " ha " + Duration.between(desde, agora).toSeconds() + " s" : "";
            String quem = sensoresAtivos();
            veredito = "CONTAGEM PAUSADA: sensor travado" + ha
                    + (quem.isEmpty() ? "" : " - " + quem + " continua ativo")
                    + ". Limpe a frente do sensor ou ajuste o limiar; a contagem volta sozinha quando ele liberar.";
        } else if (classificador.isPassando()) {
            veredito = "Dados chegando. Um sensor esta ativo agora: " + sensoresAtivos();
        } else {
            veredito = "Dados chegando e sendo gravados normalmente.";
        }

        return DiagnosticoDTO.builder()
                .veredito(veredito)
                .agora(agora)
                .ultimoCicloEm(ciclo)
                .ultimaColetaOk(ok)
                .segundosSemReceber(ok != null ? Duration.between(ok, agora).toSeconds() : null)
                .ultimaGravacaoOk(gravou)
                .ultimoErroBanco(coleta.getUltimoErroBanco())
                .ultimoErroBancoEm(erroEm)
                .cicloMedioMs(coleta.getCicloMedioMs())
                .periodoAmostragemMs(coleta.getCicloMedioMs() + props.getIntervaloMs())
                .totalPecas(repository.count())
                .totalLeiturasSensor(sensorRepository.count())
                .passando(classificador.isPassando())
                .aguardandoLiberar(classificador.isAguardandoLiberar())
                .build();
    }

    /** Ex.: "Sensor capacitivo (valor 12345, limiar 5000)" para cada sensor de peca ativo agora. */
    private String sensoresAtivos() {
        return coleta.getUltimasLeituras().stream()
                .filter(l -> l.getFuncao() != FuncaoPorta.NIVEL_RESERVATORIO && Boolean.TRUE.equals(l.getAtivo()))
                .map(l -> {
                    Porta cfg = props.getPortas().stream()
                            .filter(x -> x.getNumero() == l.getPorta())
                            .findFirst()
                            .orElse(null);
                    String limiar = "";
                    if (cfg != null && cfg.getDelta() != null && l.getLinhaBase() != null) {
                        limiar = ", livre = " + Math.round(l.getLinhaBase()) + ", ativa a partir de "
                                + (cfg.isInvertido() ? "-" : "+") + Math.round(cfg.getDelta());
                    } else if (cfg != null && cfg.getLimiar() != null) {
                        limiar = ", limiar " + Math.round(cfg.getLimiar());
                    }
                    String valor = l.getValorBruto() != null ? "valor " + l.getValorBruto() : "ativo";
                    return l.getNome() + " (" + valor + limiar + ")";
                })
                .collect(Collectors.joining(" e "));
    }

    /**
     * Diz se a peca e metalica a partir dos valores dos dois sensores. Sem parametros, usa as ultimas
     * leituras ao vivo; com os dois hex (ex.: indutivo=1F1D, capacitivo=271B), usa os valores informados.
     */
    public ClassificacaoDTO classificar(String indutivoHex, String capacitivoHex) {
        boolean manual = indutivoHex != null || capacitivoHex != null;
        if (manual && (indutivoHex == null || capacitivoHex == null)) {
            throw new IoLinkException("Informe os dois valores: indutivo e capacitivo");
        }

        Long valInd;
        Long valCap;
        Boolean ativoInd;
        Boolean ativoCap;
        String hexInd;
        String hexCap;

        if (manual) {
            Porta pInd = portaDa(FuncaoPorta.SENSOR_INDUTIVO);
            Porta pCap = portaDa(FuncaoPorta.SENSOR_CAPACITIVO);
            hexInd = indutivoHex.trim().toUpperCase();
            hexCap = capacitivoHex.trim().toUpperCase();
            valInd = decoder.valorBruto(decoder.hexParaBytes(hexInd), pInd);
            valCap = decoder.valorBruto(decoder.hexParaBytes(hexCap), pCap);
            ativoInd = ativoManual(pInd, valInd);
            ativoCap = ativoManual(pCap, valCap);
        } else {
            PortaLeituraDTO ind = ultimaLeitura(FuncaoPorta.SENSOR_INDUTIVO);
            PortaLeituraDTO cap = ultimaLeitura(FuncaoPorta.SENSOR_CAPACITIVO);
            if (ind == null || cap == null || !ind.isDisponivel() || !cap.isDisponivel()) {
                return ClassificacaoDTO.builder()
                        .classificacao("SEM_DADOS")
                        .motivo("Ainda nao ha leitura dos dois sensores")
                        .origem("AO_VIVO")
                        .build();
            }
            hexInd = ind.getHex();
            hexCap = cap.getHex();
            valInd = ind.getValorBruto();
            valCap = cap.getValorBruto();
            ativoInd = ind.getAtivo();
            ativoCap = cap.getAtivo();
        }

        String classe;
        String motivo;
        if (Boolean.TRUE.equals(ativoInd)) {
            classe = "METALICA";
            motivo = "O indutivo pegou (" + hexInd + " = " + valInd + "): so metal ativa o indutivo";
        } else if (Boolean.TRUE.equals(ativoCap)) {
            classe = "NAO_METALICA";
            motivo = "O indutivo nao pegou (" + hexInd + " = " + valInd + ") mas o capacitivo sim ("
                    + hexCap + " = " + valCap + "): tem uma peca, e nao e metal";
        } else {
            classe = "LIVRE";
            motivo = "Nenhum dos dois sensores pegou: nada na frente";
        }

        return ClassificacaoDTO.builder()
                .classificacao(classe)
                .motivo(motivo)
                .origem(manual ? "MANUAL" : "AO_VIVO")
                .indutivoHex(hexInd)
                .indutivoDecimal(valInd)
                .indutivoAtivo(ativoInd)
                .capacitivoHex(hexCap)
                .capacitivoDecimal(valCap)
                .capacitivoAtivo(ativoCap)
                .build();
    }

    private Porta portaDa(FuncaoPorta funcao) {
        return props.getPortas().stream()
                .filter(p -> p.getFuncao() == funcao)
                .findFirst()
                .orElseThrow(() -> new IoLinkException("Nenhuma porta configurada como " + funcao));
    }

    private PortaLeituraDTO ultimaLeitura(FuncaoPorta funcao) {
        return coleta.getUltimasLeituras().stream()
                .filter(l -> l.getFuncao() == funcao)
                .findFirst()
                .orElse(null);
    }

    /** Sem estado: compara com a linha de base aprendida + delta (ou com o limiar fixo). */
    private boolean ativoManual(Porta cfg, long valor) {
        if (cfg.getDelta() != null) {
            Double base = detector.getLinhaBase(cfg.getNumero());
            if (base == null) {
                throw new IoLinkException("A porta " + cfg.getNumero()
                        + " ainda nao aprendeu o valor com a esteira livre: espere a primeira leitura");
            }
            return detector.acimaDoLimite(base, valor, cfg.getDelta(), cfg.isInvertido());
        }
        if (cfg.getLimiar() != null) {
            return (valor >= cfg.getLimiar()) != cfg.isInvertido();
        }
        throw new IoLinkException("A porta " + cfg.getNumero() + " nao tem delta nem limiar configurado");
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    }
}
