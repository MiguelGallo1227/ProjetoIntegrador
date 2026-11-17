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
<<<<<<< HEAD
import jakarta.annotation.PreDestroy;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
<<<<<<< HEAD
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
=======
import java.util.concurrent.ConcurrentHashMap;
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466

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
<<<<<<< HEAD
    private final DetectorAnalogico detector;

    // usados pela thread do @Scheduled (pecas) e pela leitura do nivel em segundo plano
    private final Set<Integer> portasComFalha = ConcurrentHashMap.newKeySet();
    private final Map<Integer, String> ultimoHexSalvo = new ConcurrentHashMap<>();
    private final Map<Integer, Instant> ultimoSalvoEm = new ConcurrentHashMap<>();

    // leitura do sensor de distancia (lento): em segundo plano, para nao segurar o ciclo dos sensores de peca
    private final AtomicBoolean nivelEmAndamento = new AtomicBoolean(false);
    private volatile Instant nivelIniciadoEm;
=======

    // usados so pela thread do @Scheduled
    private final Set<Integer> portasComFalha = new HashSet<>();
    private final Map<Integer, String> ultimoHexSalvo = new HashMap<>();
    private final Map<Integer, Instant> ultimoSalvoEm = new HashMap<>();
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466

    /** Ultima leitura de cada porta (numero -> leitura), atualizada a cada ciclo. */
    private final Map<Integer, PortaLeituraDTO> ultimasLeituras = new ConcurrentHashMap<>();

    /** Instante da ultima vez que pelo menos uma porta respondeu. */
    @Getter
    private volatile Instant ultimaColetaOk;

    /** Ultima vez que o ciclo de coleta rodou, mesmo que o mestre nao tenha respondido. */
    @Getter
    private volatile Instant ultimoCicloEm;

    /** Ultima gravacao bem-sucedida no banco (peca ou historico). */
    @Getter
    private volatile Instant ultimaGravacaoOk;

    @Getter
    private volatile String ultimoErroBanco;

    @Getter
    private volatile Instant ultimoErroBancoEm;

    // maior valor de cada sensor durante a passagem em andamento (so a thread do @Scheduled mexe)
    private Long picoIndutivo;
    private String hexPicoIndutivo;
    private Long picoCapacitivo;
    private String hexPicoCapacitivo;

    private record Picos(String hexIndutivo, Long valorIndutivo, String hexCapacitivo, Long valorCapacitivo) {
    }

    /** Quanto dura, em media, um ciclo de leitura das 3 portas (ms). */
    @Getter
    private volatile long cicloMedioMs;

    /** Leitura das 3 portas ao mesmo tempo, para o ciclo durar o tempo de uma consulta so. */
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    @PreDestroy
    void encerrar() {
        executor.shutdown();
    }

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
        long inicioNano = System.nanoTime();
        ultimoCicloEm = Instant.now();

        // dispara as consultas dos sensores de peca juntas e depois processa uma a uma. A porta do nivel
        // (distancia) e lenta e nao precisa de pressa: vai em segundo plano e nao entra neste ciclo, porque
        // o ciclo e a taxa de amostragem dos sensores de peca e uma peca passa pelo indutivo em poucos ms.
        Map<Integer, CompletableFuture<LeituraBruta>> consultas = new HashMap<>();
        Porta portaIndutivo = null;
        Porta portaCapacitivo = null;
        for (Porta p : props.getPortas()) {
            int numero = p.getNumero();
            if (p.getFuncao() == FuncaoPorta.NIVEL_RESERVATORIO) {
                lerNivelEmSegundoPlano(p);
                continue;
            }
            if (p.getFuncao() == FuncaoPorta.SENSOR_INDUTIVO) {
                portaIndutivo = p;
            } else if (p.getFuncao() == FuncaoPorta.SENSOR_CAPACITIVO) {
                portaCapacitivo = p;
            }
            consultas.put(numero, CompletableFuture.supplyAsync(() -> client.lerPdin(numero), executor));
        }

        List<TipoPeca> pecasDetectadas = new ArrayList<>();
        boolean algumaOk = false;
        Boolean indutivo = null;   // null = nao leu neste ciclo
        Boolean capacitivo = null;
<<<<<<< HEAD
        Long valorIndutivo = null;
        Long valorCapacitivo = null;
        String hexIndutivo = null;
        String hexCapacitivo = null;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466

        for (Porta p : props.getPortas()) {
            CompletableFuture<LeituraBruta> consulta = consultas.get(p.getNumero());
            if (consulta == null) {
                continue; // nivel: lido em segundo plano
            }
            try {
<<<<<<< HEAD
                LeituraBruta bruta = esperar(consulta);
                String hex = bruta.hex();
                String resposta = bruta.resposta();
=======
                String hex = client.lerPdin(p.getNumero());
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
                byte[] dados = decoder.hexParaBytes(hex);
                algumaOk = true;
                registrarPortaOk(p);

                switch (p.getFuncao()) {
                    case NIVEL_RESERVATORIO -> {
<<<<<<< HEAD
                        // nao chega aqui: o nivel e lido por lerNivelEmSegundoPlano
                    }
                    case SENSOR_INDUTIVO -> {
                        indutivo = estadoSensor(dados, p);
                        valorIndutivo = brutoSensor(dados, p);
                        hexIndutivo = hex;
                        guardar(p, hex, resposta, dados, indutivo, null, brutoSensor(dados, p), null);
                    }
                    case SENSOR_CAPACITIVO -> {
                        capacitivo = estadoSensor(dados, p);
                        valorCapacitivo = brutoSensor(dados, p);
                        hexCapacitivo = hex;
                        guardar(p, hex, resposta, dados, capacitivo, null, brutoSensor(dados, p), null);
                    }
                }
            } catch (RuntimeException e) {
                registrarFalhaPorta(p, e);
=======
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
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
            }
        }

        Instant agora = Instant.now();
        if (algumaOk) {
            ultimaColetaOk = agora;
        }

        // so classifica quando os dois sensores foram lidos neste ciclo, para nao errar o tipo
<<<<<<< HEAD
        Picos picosDaPeca = null;
        if (indutivo != null && capacitivo != null) {
            // guarda o maior valor de cada sensor enquanto a peca passa (so quando algum esta ativo)
            if ((indutivo || capacitivo) && !classificador.isAguardandoLiberar()) {
                if (valorIndutivo != null && portaIndutivo != null
                        && maisExtremo(portaIndutivo, valorIndutivo, picoIndutivo)) {
                    picoIndutivo = valorIndutivo;
                    hexPicoIndutivo = hexIndutivo;
                }
                if (valorCapacitivo != null && portaCapacitivo != null
                        && maisExtremo(portaCapacitivo, valorCapacitivo, picoCapacitivo)) {
                    picoCapacitivo = valorCapacitivo;
                    hexPicoCapacitivo = hexCapacitivo;
                }
            }

            // o fim da peca nunca pode ser menor que ~2,5 ciclos de leitura, senao uma peca e "fechada"
            // entre duas leituras e o indutivo (janela curta) pode cair numa passagem seguinte
            long fimEfetivoMs = Math.max(props.getFimPecaMs(), Math.round(cicloMedioMs * 2.5));
            Optional<TipoPeca> terminou = classificador.atualizar(
                    indutivo, capacitivo, agora, fimEfetivoMs, props.getMaxPecaMs());
            if (terminou.isPresent()) {
                TipoPeca porIndutivo = terminou.get();
                TipoPeca tipoFinal = ClassificadorPeca.refinarPorAmplitude(porIndutivo, picoCapacitivo,
                        portaCapacitivo != null ? portaCapacitivo.getLimiarMetal() : null,
                        portaCapacitivo != null && portaCapacitivo.isInvertido());
                if (tipoFinal != porIndutivo) {
                    log.info("Peca reclassificada para {}: o indutivo nao foi amostrado, mas o capacitivo chegou a {} "
                            + "(limiar-metal {})", tipoFinal, picoCapacitivo, portaCapacitivo.getLimiarMetal());
                }
                pecasDetectadas.add(tipoFinal);
                picosDaPeca = new Picos(hexPicoIndutivo, picoIndutivo, hexPicoCapacitivo, picoCapacitivo);
                picoIndutivo = null;
                hexPicoIndutivo = null;
                picoCapacitivo = null;
                hexPicoCapacitivo = null;
            }
=======
        if (indutivo != null && capacitivo != null) {
            classificador.atualizar(indutivo, capacitivo, agora, props.getFimPecaMs(), props.getMaxPecaMs())
                    .ifPresent(pecasDetectadas::add);
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
        }

        // o nivel e lido antes de salvar, para a leitura da peca ja sair com o nivel certo
        double nivel = nivelAtual != null ? nivelAtual : 0.0;
        for (TipoPeca tipo : pecasDetectadas) {
            try {
                Leitura salva = repository.save(Leitura.builder()
                        .dataHora(agora)
                        .tipoPeca(tipo)
                        .nivelReservatorio(nivel)
<<<<<<< HEAD
                        .hexIndutivo(picosDaPeca != null ? picosDaPeca.hexIndutivo() : null)
                        .valorIndutivo(picosDaPeca != null ? picosDaPeca.valorIndutivo() : null)
                        .hexCapacitivo(picosDaPeca != null ? picosDaPeca.hexCapacitivo() : null)
                        .valorCapacitivo(picosDaPeca != null ? picosDaPeca.valorCapacitivo() : null)
                        .build());
                ultimaGravacaoOk = Instant.now();
                log.info("Peca {} gravada (id {}, nivel {}%): indutivo {} = {}, capacitivo {} = {}", tipo, salva.getId(), nivel,
                        salva.getHexIndutivo(), salva.getValorIndutivo(), salva.getHexCapacitivo(), salva.getValorCapacitivo());
            } catch (RuntimeException e) {
                registrarErroBanco(e);
                log.error("Peca {} detectada, mas nao foi possivel gravar no banco: {}", tipo, e.getMessage());
            }
        }

        long ms = (System.nanoTime() - inicioNano) / 1_000_000;
        cicloMedioMs = cicloMedioMs == 0 ? ms : Math.round(cicloMedioMs * 0.9 + ms * 0.1);
    }

    private LeituraBruta esperar(CompletableFuture<LeituraBruta> consulta) {
        try {
            return consulta.join();
        } catch (CompletionException e) {
            if (e.getCause() instanceof RuntimeException causa) {
                throw causa;
            }
            throw e;
        }
    }

    /** Sensor de peca: relativo a linha de base (delta), limiar fixo ou bit, nessa ordem. */
    private boolean estadoSensor(byte[] dados, Porta p) {
        if (p.getDelta() != null) {
            return detector.atualizar(p.getNumero(), decoder.valorBruto(dados, p), p.getDelta(), p.isInvertido());
        }
        return decoder.estadoAtivo(dados, p);
    }

    /** Valor analogico do sensor de peca (para mostrar na tela); null se ele manda so um bit. */
    private Long brutoSensor(byte[] dados, Porta p) {
        return p.getLimiar() != null || p.getDelta() != null ? decoder.valorBruto(dados, p) : null;
    }

    /** Valor mais "do lado da peca": o maior se a peca sobe o valor, o menor se o sensor e invertido. */
    private static boolean maisExtremo(Porta p, long novo, Long atual) {
        return atual == null || (p.isInvertido() ? novo < atual : novo > atual);
    }

    private void registrarPortaOk(Porta p) {
        if (portasComFalha.remove(p.getNumero())) {
            log.info("Porta {} voltou a responder", p.getNumero());
=======
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
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
        }
    }

    private void registrarFalhaPorta(Porta p, RuntimeException e) {
        String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        guardar(p, null, null, null, null, null, null, msg);
        if (portasComFalha.add(p.getNumero())) {
            log.warn("Porta {} sem leitura: {}", p.getNumero(), msg);
        }
    }

    /** Le o sensor de distancia de tempos em tempos, fora do ciclo dos sensores de peca. */
    private void lerNivelEmSegundoPlano(Porta p) {
        Instant ultimo = nivelIniciadoEm;
        if (ultimo != null && Duration.between(ultimo, Instant.now()).toMillis() < props.getNivelIntervaloMs()) {
            return;
        }
        if (!nivelEmAndamento.compareAndSet(false, true)) {
            return; // a leitura anterior ainda nao voltou
        }
        nivelIniciadoEm = Instant.now();
        executor.execute(() -> {
            try {
                LeituraBruta bruta = client.lerPdin(p.getNumero());
                byte[] dados = decoder.hexParaBytes(bruta.hex());
                double pct = decoder.nivelPercentual(dados, p);
                registrarPortaOk(p);
                nivelAtual = pct;
                ultimaColetaOk = Instant.now();
                guardar(p, bruta.hex(), bruta.resposta(), dados, null, pct, decoder.valorBruto(dados, p), null);
            } catch (RuntimeException e) {
                registrarFalhaPorta(p, e);
            } finally {
                nivelEmAndamento.set(false);
            }
        });
    }

    private void guardar(Porta p, String hex, String resposta, byte[] dados, Boolean ativo, Double nivel, Long bruto, String erro) {
        ultimasLeituras.put(p.getNumero(), PortaLeituraDTO.builder()
                .porta(p.getNumero())
                .nome(p.getNome())
                .funcao(p.getFuncao())
                .disponivel(erro == null)
                .hex(hex)
                .resposta(resposta)
                .binario(dados != null ? decoder.binario(dados) : null)
                .ativo(ativo)
                .valorBruto(bruto)
                .linhaBase(p.getDelta() != null ? detector.getLinhaBase(p.getNumero()) : null)
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
            ultimaGravacaoOk = agora;
        } catch (RuntimeException e) {
            registrarErroBanco(e);
            log.error("Nao foi possivel gravar a leitura da porta {} no banco: {}", p.getNumero(), e.getMessage());
        }
    }

    private void registrarErroBanco(RuntimeException e) {
        String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        ultimoErroBanco = msg.length() > 300 ? msg.substring(0, 300) + "..." : msg;
        ultimoErroBancoEm = Instant.now();
    }
}
