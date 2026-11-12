package com.senai.ProjetoInterdisciplinar;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "iolink.simulado=true")
@ActiveProfiles("h2")
class ProjetoInterdisciplinarApplicationTests {

	@Test
	void contextLoads() {
	}

}
