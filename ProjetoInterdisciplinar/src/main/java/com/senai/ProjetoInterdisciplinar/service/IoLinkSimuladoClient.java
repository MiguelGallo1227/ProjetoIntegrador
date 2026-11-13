package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.HexFormat;

/**
 * Gera process data falso, no mesmo formato configurado para cada porta.
 * Uma peca a cada 3 s (pulso de 0,7 s; metalica ativa indutivo e capacitivo, as outras so o capacitivo) e o reservatorio enchendo ate esvaziar.
 * Ative com iolink.simulado=true.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "iolink", name = "simulado", havingValue = "true")
public class IoLinkSimuladoClient implements IoLinkClient {

    private final IoLinkProperties props;

    @Override
    public String lerPdin(int numeroPorta) {
        IoLinkProperties.Porta p = props.getPortas().stream()
                .filter(x -> x.getNumero() == numeroPorta)
                .findFirst()
                .orElseThrow(() -> new IoLinkException("Porta " + numeroPorta + " nao configurada"));

        long agora = System.currentTimeMillis();
        long slot = agora / 3000;
        boolean pulso = agora % 3000 < 700;
        boolean metalica = Math.floorMod(slot * 2654435761L >>> 5, 100) < 62;

        byte[] buf = new byte[Math.max(2, p.getByteIndex() + Math.max(1, p.getTamanhoBytes()))];
        switch (p.getFuncao()) {
            case SENSOR_INDUTIVO -> definirSensor(buf, p, pulso && metalica);
            case SENSOR_CAPACITIVO -> definirSensor(buf, p, pulso);
            case NIVEL_RESERVATORIO -> {
                double pct = Math.min(100, 4 + (slot % 55) * 1.8);
                long raw = Math.round(p.getValorVazio() + pct / 100.0 * (p.getValorCheio() - p.getValorVazio()));
                escrever(buf, p, raw);
            }
        }
        return HexFormat.of().withUpperCase().formatHex(buf);
    }

    /** Sensor com limiar: escreve um valor acima (ativo) ou bem abaixo (livre) do limiar. */
    private void definirSensor(byte[] buf, IoLinkProperties.Porta p, boolean ativo) {
        if (p.getLimiar() == null) {
            definirBit(buf, p, ativo);
            return;
        }
        boolean acima = ativo != p.isInvertido();
        escrever(buf, p, Math.round(acima ? p.getLimiar() * 1.5 : p.getLimiar() * 0.1));
    }

    private void escrever(byte[] buf, IoLinkProperties.Porta p, long raw) {
        int tam = Math.max(1, p.getTamanhoBytes());
        for (int i = 0; i < tam; i++) {
            buf[p.getByteIndex() + tam - 1 - i] = (byte) (raw >> (8 * i));
        }
    }

    private void definirBit(byte[] buf, IoLinkProperties.Porta p, boolean ativo) {
        boolean bit = ativo != p.isInvertido();
        if (bit) {
            buf[p.getByteIndex()] |= (byte) (1 << p.getBitIndex());
        }
    }
}
