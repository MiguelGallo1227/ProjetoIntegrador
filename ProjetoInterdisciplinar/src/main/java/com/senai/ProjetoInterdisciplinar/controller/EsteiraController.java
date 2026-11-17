package com.senai.ProjetoInterdisciplinar.controller;

import com.senai.ProjetoInterdisciplinar.DTO.ClassificacaoDTO;
import com.senai.ProjetoInterdisciplinar.DTO.DiagnosticoDTO;
import com.senai.ProjetoInterdisciplinar.DTO.EsteiraStatusDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraDTO;
import com.senai.ProjetoInterdisciplinar.DTO.LeituraSensorDTO;
import com.senai.ProjetoInterdisciplinar.DTO.PortaLeituraDTO;
import com.senai.ProjetoInterdisciplinar.service.EsteiraService;
import com.senai.ProjetoInterdisciplinar.service.IoLinkException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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

    /** Historico gravado no banco: o que chegou dos sensores (filtre por porta se quiser). */
    @GetMapping("/iolink/historico")
    public List<LeituraSensorDTO> historico(@RequestParam(required = false) Integer porta,
                                            @RequestParam(defaultValue = "100") int limite) {
        return service.historico(porta, limite);
    }
<<<<<<< HEAD

    /** Diagnostico: os dados estao chegando? estao sendo gravados no banco? */
    @GetMapping("/diagnostico")
    public DiagnosticoDTO diagnostico() {
        return service.diagnostico();
    }

    /**
     * Metalica ou nao? Sem parametros usa as leituras ao vivo; para testar com valores seus:
     * /api/classificar?indutivo=1F1D&capacitivo=271B
     */
    @GetMapping("/classificar")
    public ClassificacaoDTO classificar(@RequestParam(required = false) String indutivo,
                                        @RequestParam(required = false) String capacitivo) {
        try {
            return service.classificar(indutivo, capacitivo);
        } catch (IoLinkException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
}
