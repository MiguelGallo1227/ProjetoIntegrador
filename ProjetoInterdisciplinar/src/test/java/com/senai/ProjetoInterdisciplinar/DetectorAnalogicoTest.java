package com.senai.ProjetoInterdisciplinar;

import com.senai.ProjetoInterdisciplinar.service.DetectorAnalogico;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DetectorAnalogicoTest {

    @Test
    void indutivoComOsValoresMedidos() {
        DetectorAnalogico d = new DetectorAnalogico();
        assertFalse(d.atualizar(2, 558, 4500));    // livre, aprende a linha de base
        assertFalse(d.atualizar(2, 2711, 4500));   // nao metalica: nao chega a pegar
        assertTrue(d.atualizar(2, 7921, 4500));    // metalica: pega
        assertTrue(d.atualizar(2, 4000, 4500));    // histerese: segue ativo ate cair bem
        assertFalse(d.atualizar(2, 600, 4500));    // livre de novo
    }

    @Test
    void corrigeALinhaDeBaseSeComecouComPecaNaFrente() {
        DetectorAnalogico d = new DetectorAnalogico();
        d.atualizar(3, 10000, 3000);               // primeira leitura ja com peca: base errada
        for (int i = 0; i < 30; i++) {
            d.atualizar(3, 500, 3000);             // esteira livre: a base desce
        }
        assertTrue(d.atualizar(3, 10000, 3000));   // agora a peca e detectada
    }

    @Test
    void sensorSemprePertoDaBaseNuncaAtiva() {
        DetectorAnalogico d = new DetectorAnalogico();
        for (int i = 0; i < 100; i++) {
            assertFalse(d.atualizar(3, 9000 + (i % 5) * 20, 3000)); // valor alto mas estavel: e a linha de base
        }
    }

    @Test
    void sensorInvertidoPegaQuandoOValorCai() {
        // sensor que manda 32736 (fora de alcance) livre e cai para ~10039 com metal na frente
        DetectorAnalogico d = new DetectorAnalogico();
        assertFalse(d.atualizar(3, 32736, 10000, true));  // livre: aprende a linha de base
        assertTrue(d.atualizar(3, 10011, 10000, true));   // metal: o valor cai, pega
        assertTrue(d.atualizar(3, 20000, 10000, true));   // histerese: segue ativo ate voltar bem
        assertFalse(d.atualizar(3, 32736, 10000, true));  // livre de novo
        assertFalse(d.atualizar(3, 32736, 10000, true));  // e continua livre (nao fica "travado" ativo)
    }

    @Test
    void sensorInvertidoNaoTravaDepoisDeUmaPeca() {
        // com a logica antiga (so "sobe"), a volta ao valor livre contava como peca e o sensor travava
        DetectorAnalogico d = new DetectorAnalogico();
        d.atualizar(3, 32736, 10000, true);
        for (int i = 0; i < 5; i++) {
            d.atualizar(3, 10039, 10000, true);
        }
        for (int i = 0; i < 20; i++) {
            assertFalse(d.atualizar(3, 32736, 10000, true));
        }
    }

    @Test
    void sensorInvertidoCorrigeABaseSeComecouComPecaNaFrente() {
        DetectorAnalogico d = new DetectorAnalogico();
        d.atualizar(3, 10039, 10000, true);               // primeira leitura ja com peca: base errada (baixa)
        for (int i = 0; i < 30; i++) {
            d.atualizar(3, 32736, 10000, true);           // esteira livre: a base sobe rapido
        }
        assertTrue(d.atualizar(3, 10039, 10000, true));   // agora a peca e detectada
    }
}
