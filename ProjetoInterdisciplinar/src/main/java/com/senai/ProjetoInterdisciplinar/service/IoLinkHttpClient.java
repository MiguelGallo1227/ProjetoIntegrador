package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.DTO.IoLinkResponse;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;

/**
 * Le o process data direto do mestre IO-Link:
 * http://IP/iolinkmaster/port[N]/iolinkdevice/pdin/getdata
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "iolink", name = "simulado", havingValue = "false", matchIfMissing = true)
public class IoLinkHttpClient implements IoLinkClient {

    private final RestClient ioLinkRestClient;
    private final IoLinkProperties props;

    @Override
    public String lerPdin(int porta) {
        // os colchetes de port[N] precisam ir codificados (%5B e %5D) para virar uma URI valida
        String base = props.getBaseUrl().replaceAll("/+$", "");
        URI uri = URI.create(base + "/iolinkmaster/port%5B" + porta + "%5D/iolinkdevice/pdin/getdata");

        IoLinkResponse resposta;
        try {
            resposta = ioLinkRestClient.get().uri(uri).retrieve().body(IoLinkResponse.class);
        } catch (RestClientException e) {
            throw new IoLinkException("Falha ao acessar a porta " + porta + ": " + e.getMessage(), e);
        }

        if (resposta == null || resposta.getData() == null || resposta.getData().getValue() == null) {
            throw new IoLinkException("Resposta sem dados na porta " + porta);
        }
        if (resposta.getCode() != null && resposta.getCode() != 200) {
            throw new IoLinkException("Mestre respondeu code " + resposta.getCode() + " na porta " + porta);
        }
        return resposta.getData().getValue();
    }
}
