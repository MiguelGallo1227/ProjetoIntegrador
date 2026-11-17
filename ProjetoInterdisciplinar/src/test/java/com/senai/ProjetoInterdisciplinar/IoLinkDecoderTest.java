package com.senai.ProjetoInterdisciplinar;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import com.senai.ProjetoInterdisciplinar.service.IoLinkDecoder;
import com.senai.ProjetoInterdisciplinar.service.IoLinkException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IoLinkDecoderTest {

    private final IoLinkDecoder decoder = new IoLinkDecoder();

    @Test
    void lerBitDoSensorDigital() {
        Porta p = new Porta();
        p.setNumero(1);
        p.setByteIndex(0);
        p.setBitIndex(0);

        assertTrue(decoder.estadoAtivo(decoder.hexParaBytes("0100"), p));
        assertFalse(decoder.estadoAtivo(decoder.hexParaBytes("0000"), p));

        p.setInvertido(true);
        assertFalse(decoder.estadoAtivo(decoder.hexParaBytes("0100"), p));
    }

    @Test
    void sensorAnalogicoUsaLimiar() {
<<<<<<< HEAD
        // valores medidos (hoje atribuidos ao CAPACITIVO): livre 022E (558), nao metalica 0A97 (2711), metalica 1EF1 (7921)
=======
        // indutivo medido: sem peca 022E (558), nao metalica 0A97 (2711), metalica 1EF1 (7921)
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
        Porta p = new Porta();
        p.setNumero(2);
        p.setByteIndex(0);
        p.setTamanhoBytes(2);
        p.setLimiar(5000.0);

        assertFalse(decoder.estadoAtivo(decoder.hexParaBytes("022E"), p));
        assertFalse(decoder.estadoAtivo(decoder.hexParaBytes("0A97"), p));
        assertTrue(decoder.estadoAtivo(decoder.hexParaBytes("1EF1"), p));

        p.setInvertido(true);
        assertTrue(decoder.estadoAtivo(decoder.hexParaBytes("022E"), p));
    }

    @Test
<<<<<<< HEAD
    void hexParaDecimal() {
        Porta p = new Porta();
        p.setNumero(2);
        p.setTamanhoBytes(2);

        assertEquals(7965L, decoder.valorBruto(decoder.hexParaBytes("1F1D"), p));
        assertEquals(10067L, decoder.valorBruto(decoder.hexParaBytes("2753"), p));
        assertEquals(1925L, decoder.valorBruto(decoder.hexParaBytes("0785"), p));
    }

    @Test
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    void converterNivelParaPercentual() {
        Porta p = new Porta();
        p.setNumero(3);
        p.setTamanhoBytes(2);
        p.setValorVazio(0);
        p.setValorCheio(1000);

        assertEquals(50.0, decoder.nivelPercentual(decoder.hexParaBytes("01F4"), p));  // 500
        assertEquals(100.0, decoder.nivelPercentual(decoder.hexParaBytes("FFFF"), p)); // limitado a 100
    }

    @Test
    void nivelComEscalaInvertida() {
        // sensor de distancia: 400 mm = vazio, 100 mm = cheio
        Porta p = new Porta();
        p.setNumero(3);
        p.setValorVazio(400);
        p.setValorCheio(100);

        assertEquals(50.0, decoder.nivelPercentual(decoder.hexParaBytes("00FA"), p)); // 250 mm
    }

    @Test
    void hexInvalidoLancaExcecao() {
        assertThrows(IoLinkException.class, () -> decoder.hexParaBytes("ZZ"));
        assertThrows(IoLinkException.class, () -> decoder.hexParaBytes(""));
    }
}
