package com.senai.ProjetoInterdisciplinar;

import com.senai.ProjetoInterdisciplinar.repostory.LeituraSensorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "iolink.simulado=true")
@ActiveProfiles("h2")
class ColetaHistoricoTest {

    @Autowired
    private LeituraSensorRepository repository;

    @Test
    void coletaGravaLeituraDoSensorDeDistanciaNoBanco() throws InterruptedException {
        long limite = System.currentTimeMillis() + 5000;
        while (repository.count() < 1 && System.currentTimeMillis() < limite) {
            Thread.sleep(100);
        }
        assertTrue(repository.count() >= 1, "esperava ao menos uma leitura do sensor de distancia gravada");
    }
}
