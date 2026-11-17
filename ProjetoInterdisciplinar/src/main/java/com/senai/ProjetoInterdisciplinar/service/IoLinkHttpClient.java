package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.DTO.IoLinkResponse;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties;
import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;

/**
 * Le os sensores por HTTP. Se a porta tem "url" no application.properties, le dessa API
 * (ex.: http://10.110.12.76:5000/sensores/indutivo); senao, le direto do mestre IO-Link:
 * http://IP/iolinkmaster/port[N]/iolinkdevice/pdin/getdata
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "iolink", name = "simulado", havingValue = "false", matchIfMissing = true)
public class IoLinkHttpClient implements IoLinkClient {

    private final RestClient ioLinkRestClient;
    private final IoLinkProperties props;

    @Override
    public LeituraBruta lerPdin(int porta) {
        Porta cfg = props.getPortas().stream()
                .filter(p -> p.getNumero() == porta)
                .findFirst()
                .orElseThrow(() -> new IoLinkException("Porta " + porta + " nao configurada"));

        if (cfg.getUrl() != null && !cfg.getUrl().isBlank()) {
            return lerDaApi(cfg);
        }
        return lerDoMestre(porta);
    }

    /** API propria de cada sensor: aceita numero, hexadecimal, true/false ou JSON. */
    private LeituraBruta lerDaApi(Porta cfg) {
        String corpo;
        try {
            URI uri = URI.create(cfg.getUrl().trim());
            corpo = ioLinkRestClient.get().uri(uri).retrieve().body(String.class);
        } catch (IllegalArgumentException e) {
            throw new IoLinkException("URL invalida na porta " + cfg.getNumero() + ": " + cfg.getUrl(), e);
        } catch (RestClientException e) {
            throw new IoLinkException("Falha ao acessar " + cfg.getUrl() + ": " + e.getMessage(), e);
        }

        // formato do mestre ({"cid":..,"data":{"value":"1F1D"},"code":200}): valor sempre em hexadecimal
        boolean formatoMestre = InterpretadorResposta.formatoMestre(corpo);
        if (formatoMestre) {
            Integer code = InterpretadorResposta.codigo(corpo);
            if (code != null && code != 200) {
                throw new IoLinkException("API respondeu code " + code + " na porta " + cfg.getNumero()
                        + ": " + InterpretadorResposta.resumo(corpo));
            }
        }

        String valor = InterpretadorResposta.extrairValor(corpo, cfg.getCampo(), cfg.getNumero());
        String hex = InterpretadorResposta.paraHex(valor, cfg, formatoMestre ? Boolean.TRUE : null);
        return new LeituraBruta(hex, InterpretadorResposta.resumo(corpo));
    }

    /** Mestre IO-Link: {"cid":-1,"data":{"value":"022E"},"code":200} */
    private LeituraBruta lerDoMestre(int porta) {
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
        String hex = resposta.getData().getValue();
        return new LeituraBruta(hex, hex);
    }
}
