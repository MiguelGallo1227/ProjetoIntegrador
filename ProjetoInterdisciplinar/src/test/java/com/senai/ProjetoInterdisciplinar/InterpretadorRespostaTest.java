package com.senai.ProjetoInterdisciplinar;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import com.senai.ProjetoInterdisciplinar.service.InterpretadorResposta;
import com.senai.ProjetoInterdisciplinar.service.IoLinkException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InterpretadorRespostaTest {

    @Test
    void extraiValorDeVariosFormatos() {
        assertEquals("022E", InterpretadorResposta.extrairValor(
                "{\"cid\":-1,\"data\":{\"value\":\"022E\"},\"code\":200}", null, 2));
        assertEquals("12.5", InterpretadorResposta.extrairValor("{\"valor\": 12.5}", null, 1));
        assertEquals("120", InterpretadorResposta.extrairValor("{\"distancia\": 120, \"unidade\": \"mm\"}", null, 1));
        assertEquals("true", InterpretadorResposta.extrairValor("{\"indutivo\": true}", null, 2));
        assertEquals("123", InterpretadorResposta.extrairValor("123\n", null, 1));
        assertEquals("77", InterpretadorResposta.extrairValor("{\"a\":1,\"leitura\":77}", "leitura", 1));
    }

    @Test
    void campoDesconhecidoMostraARespostaNoErro() {
        IoLinkException e = assertThrows(IoLinkException.class,
                () -> InterpretadorResposta.extrairValor("{\"xyz\": 5}", null, 3));
        assertEquals(true, e.getMessage().contains("{\"xyz\": 5}"));
    }

    @Test
    void convertePraHex() {
        Porta p = new Porta();
        p.setNumero(1);
        p.setTamanhoBytes(2);

        assertEquals("0078", InterpretadorResposta.paraHex("120", p));   // decimal
        assertEquals("022E", InterpretadorResposta.paraHex("022E", p));   // hexadecimal (tem letras)
        assertEquals("0001", InterpretadorResposta.paraHex("true", p));
        assertEquals("0000", InterpretadorResposta.paraHex("false", p));

        p.setHexadecimal(true);
        assertEquals("2753", InterpretadorResposta.paraHex("2753", p));   // forcado hexadecimal

        p.setHexadecimal(null);
        p.setEscala(10);
        assertEquals("007D", InterpretadorResposta.paraHex("12.5", p));   // 12,5 x 10 = 125
    }

    @Test
    void formatoDoMestreEHexadecimalMesmoSoComDigitos() {
        String corpo = "{\"cid\":-1,\"data\":{\"value\":\"2753\"},\"code\":200}";
        assertTrue(InterpretadorResposta.formatoMestre(corpo));
        assertEquals(200, InterpretadorResposta.codigo(corpo));

        Porta p = new Porta();
        p.setNumero(3);
        String valor = InterpretadorResposta.extrairValor(corpo, null, 3);

        // hexadecimal: 0x2753 = 10067
        assertEquals("2753", InterpretadorResposta.paraHex(valor, p, true));
        // sem saber o formato, "2753" seria lido como decimal 2753 (0x0AC1), valor errado
        assertEquals("0AC1", InterpretadorResposta.paraHex(valor, p, null));
        // configuracao explicita (hexadecimal=true) tambem resolve
        p.setHexadecimal(true);
        assertEquals("2753", InterpretadorResposta.paraHex(valor, p));
    }
}
