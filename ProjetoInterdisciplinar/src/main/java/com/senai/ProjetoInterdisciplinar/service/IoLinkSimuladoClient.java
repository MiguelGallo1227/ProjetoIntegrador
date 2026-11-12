package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.HexFormat;

/**
 * Gera process data falso, no mesmo formato configurado para cada porta.
 * Uma peca a cada 3 s (pulso de 0,7 s) e o reservatorio enchendo ate esvaziar.
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
            case PECA_METALICA -> definirBit(buf, p, pulso && metalica);
            case PECA_NAO_METALICA -> definirBit(buf, p, pulso && !metalica);
            case NIVEL_RESERVATORIO -> {
                double pct = Math.min(100, 4 + (slot % 55) * 1.8);
                long raw = Math.round(p.getValorVazio() + pct / 100.0 * (p.getValorCheio() - p.getValorVazio()));
                int tam = Math.max(1, p.getTamanhoBytes());
                for (int i = 0; i < tam; i++) {
                    buf[p.getByteIndex() + tam - 1 - i] = (byte) (raw >> (8 * i));
                }
            }
        }
        return HexFormat.of().withUpperCase().formatHex(buf);
    }

    private void definirBit(byte[] buf, IoLinkProperties.Porta p, boolean ativo) {
        boolean bit = ativo != p.isInvertido();
        if (bit) {
            buf[p.getByteIndex()] |= (byte) (1 << p.getBitIndex());
        }
    }
}
