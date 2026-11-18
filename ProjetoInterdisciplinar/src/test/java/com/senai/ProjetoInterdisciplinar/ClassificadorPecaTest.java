package com.senai.ProjetoInterdisciplinar;

import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import com.senai.ProjetoInterdisciplinar.service.ClassificadorPeca;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClassificadorPecaTest {

    private final Instant t = Instant.parse("2026-11-12T10:00:00Z");

    @Test
    void soCapacitivoEPecaNaoMetalica() {
        ClassificadorPeca c = new ClassificadorPeca();
        assertTrue(c.atualizar(false, true, t, 300, 5000).isEmpty());
        assertTrue(c.atualizar(false, false, t.plusMillis(100), 300, 5000).isEmpty()); // ainda esperando o fim
        assertEquals(Optional.of(TipoPeca.NAO_METALICA), c.atualizar(false, false, t.plusMillis(500), 300, 5000));
    }

    @Test
    void indutivoPegouEPecaMetalica() {
        ClassificadorPeca c = new ClassificadorPeca();
        assertTrue(c.atualizar(false, true, t, 300, 5000).isEmpty());
        assertTrue(c.atualizar(true, true, t.plusMillis(200), 300, 5000).isEmpty());
        assertTrue(c.atualizar(false, true, t.plusMillis(400), 300, 5000).isEmpty());
        assertEquals(Optional.of(TipoPeca.METALICA), c.atualizar(false, false, t.plusMillis(900), 300, 5000));
    }

    @Test
    void soIndutivoTambemEMetalica() {
        ClassificadorPeca c = new ClassificadorPeca();
        c.atualizar(true, false, t, 300, 5000);
        assertEquals(Optional.of(TipoPeca.METALICA), c.atualizar(false, false, t.plusMillis(400), 300, 5000));
    }

    @Test
    void naoContaDuasVezesAMesmaPeca() {
        ClassificadorPeca c = new ClassificadorPeca();
        c.atualizar(false, true, t, 300, 5000);
        assertTrue(c.atualizar(false, false, t.plusMillis(400), 300, 5000).isPresent());
        assertTrue(c.atualizar(false, false, t.plusMillis(800), 300, 5000).isEmpty());
    }

    @Test
    void sensorTravadoContaUmaPecaEEsperaLiberar() {
        ClassificadorPeca c = new ClassificadorPeca();
        assertTrue(c.atualizar(false, true, t, 300, 5000).isEmpty());
        assertTrue(c.atualizar(false, true, t.plusMillis(2000), 300, 5000).isEmpty());
        // passou do limite: conta uma peca mesmo com o sensor ainda ativo
        assertEquals(Optional.of(TipoPeca.NAO_METALICA), c.atualizar(false, true, t.plusMillis(5000), 300, 5000));
        // enquanto estiver travado, nao conta mais nada
        assertTrue(c.atualizar(false, true, t.plusMillis(9000), 300, 5000).isEmpty());
        // liberou: volta a aceitar pecas
        assertTrue(c.atualizar(false, false, t.plusMillis(9500), 300, 5000).isEmpty());
        assertTrue(c.atualizar(true, true, t.plusMillis(10000), 300, 5000).isEmpty());
        assertEquals(Optional.of(TipoPeca.METALICA), c.atualizar(false, false, t.plusMillis(10500), 300, 5000));
    }

    @Test
    void regraInstantaneaComOsValoresMedidos() {
        // indutivo ativo = metalica, mesmo com o capacitivo ativo junto
        assertEquals(Optional.of(TipoPeca.METALICA), ClassificadorPeca.instantaneo(true, true));
        assertEquals(Optional.of(TipoPeca.METALICA), ClassificadorPeca.instantaneo(true, false));
        // so o capacitivo = nao metalica
        assertEquals(Optional.of(TipoPeca.NAO_METALICA), ClassificadorPeca.instantaneo(false, true));
        // nenhum = nada na frente
        assertTrue(ClassificadorPeca.instantaneo(false, false).isEmpty());
    }

    @Test
    void amplitudeDoCapacitivoSalvaMetalQueOIndutivoNaoViu() {
        // o indutivo (alcance curto) nao foi amostrado, mas o capacitivo chegou a 7644 (metal: >= 5000)
        assertEquals(TipoPeca.METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, 7644L, 5000.0, false));
        // nao metalica: o capacitivo so chegou a 2711
        assertEquals(TipoPeca.NAO_METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, 2711L, 5000.0, false));
        // recurso desligado (limiar-metal ausente) ou capacitivo nao amostrado: nada muda
        assertEquals(TipoPeca.NAO_METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, 7644L, null, false));
        assertEquals(TipoPeca.NAO_METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, null, 5000.0, false));
        // nunca rebaixa uma metalica
        assertEquals(TipoPeca.METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.METALICA, 100L, 5000.0, false));
        // sensor invertido: o valor cai com metal (<= 20000)
        assertEquals(TipoPeca.METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, 10039L, 20000.0, true));
        assertEquals(TipoPeca.NAO_METALICA,
                ClassificadorPeca.refinarPorAmplitude(TipoPeca.NAO_METALICA, 32736L, 20000.0, true));
    }
}
