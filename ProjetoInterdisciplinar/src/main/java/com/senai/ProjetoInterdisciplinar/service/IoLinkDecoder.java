package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import org.springframework.stereotype.Component;

import java.util.HexFormat;

/** Converte o process data (hex) de cada porta em estado de peca ou nivel em %. */
@Component
public class IoLinkDecoder {

    public byte[] hexParaBytes(String hex) {
        if (hex == null || hex.isBlank()) {
            throw new IoLinkException("Process data vazio");
        }
        String limpo = hex.trim();
        if (limpo.startsWith("0x") || limpo.startsWith("0X")) {
            limpo = limpo.substring(2);
        }
        try {
            return HexFormat.of().parseHex(limpo);
        } catch (IllegalArgumentException e) {
            throw new IoLinkException("Process data invalido: " + hex, e);
        }
    }

    /** Sensor digital: le o bit configurado (e inverte se "invertido"). */
    public boolean estadoAtivo(byte[] dados, Porta p) {
        if (p.getBitIndex() < 0 || p.getBitIndex() > 7) {
            throw new IoLinkException("bit-index deve ficar entre 0 e 7 (porta " + p.getNumero() + ")");
        }
        verificarTamanho(dados, p.getByteIndex(), 1, p);
        boolean bit = ((dados[p.getByteIndex()] >> p.getBitIndex()) & 1) == 1;
        return bit != p.isInvertido();
    }

    /** Sensor analogico: valor bruto (big-endian) a partir de byte-index. */
    public long valorBruto(byte[] dados, Porta p) {
        int tam = p.getTamanhoBytes();
        if (tam < 1 || tam > 4) {
            throw new IoLinkException("tamanho-bytes deve ficar entre 1 e 4 (porta " + p.getNumero() + ")");
        }
        verificarTamanho(dados, p.getByteIndex(), tam, p);

        long raw = 0;
        for (int i = 0; i < tam; i++) {
            raw = (raw << 8) | (dados[p.getByteIndex() + i] & 0xFF);
        }
        if (p.isComSinal()) {
            int bits = tam * 8;
            if ((raw & (1L << (bits - 1))) != 0) {
                raw -= 1L << bits;
            }
        }
        return raw;
    }

    /** Converte o valor bruto para 0..100 % usando valor-vazio e valor-cheio. */
    public double nivelPercentual(byte[] dados, Porta p) {
        double faixa = p.getValorCheio() - p.getValorVazio();
        if (faixa == 0) {
            throw new IoLinkException("valor-vazio e valor-cheio iguais (porta " + p.getNumero() + ")");
        }
        double pct = (valorBruto(dados, p) - p.getValorVazio()) / faixa * 100.0;
        pct = Math.max(0, Math.min(100, pct));
        return Math.round(pct * 10) / 10.0;
    }

    private void verificarTamanho(byte[] dados, int inicio, int tam, Porta p) {
        if (inicio < 0 || inicio + tam > dados.length) {
            throw new IoLinkException("Process data da porta " + p.getNumero() + " tem " + dados.length
                    + " byte(s); byte-index " + inicio + " fora do alcance");
        }
    }
}
