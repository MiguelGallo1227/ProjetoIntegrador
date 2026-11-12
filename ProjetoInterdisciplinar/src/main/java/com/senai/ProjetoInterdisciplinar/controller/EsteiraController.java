package com.senai.ProjetoInterdisciplinar.controller;

import com.senai.ProjetoInterdisciplinar.DTO.EsteiraStatusDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraDTO;
import com.senai.ProjetoInterdisciplinar.DTO.PortaLeituraDTO;
import com.senai.ProjetoInterdisciplinar.service.EsteiraService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EsteiraController {

    private final EsteiraService service;

    @GetMapping("/esteira/status")
    public EsteiraStatusDTO status() {
        return service.status();
    }

    @GetMapping("/leituras")
    public List<LeituraDTO> leituras(@RequestParam(defaultValue = "200") int limite) {
        return service.leituras(limite);
    }

    /** Diagnostico: leitura ao vivo das 3 portas do mestre IO-Link. */
    @GetMapping("/iolink/portas")
    public List<PortaLeituraDTO> portas() {
        return service.portasAoVivo();
    }
}
