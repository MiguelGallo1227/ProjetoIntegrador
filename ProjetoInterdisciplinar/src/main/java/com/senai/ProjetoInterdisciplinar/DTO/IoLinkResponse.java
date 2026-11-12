package com.senai.ProjetoInterdisciplinar.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Resposta do mestre IO-Link em .../pdin/getdata. Exemplo:
 * {"cid":-1,"data":{"value":"0001"},"code":200}
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class IoLinkResponse {

    private Integer code;
    private Dados data;

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Dados {
        /** Process data de entrada em hexadecimal. */
        private String value;
    }
}
