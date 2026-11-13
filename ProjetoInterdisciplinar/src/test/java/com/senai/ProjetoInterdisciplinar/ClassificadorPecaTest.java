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
}
