package com.senai.ProjetoInterdisciplinar.service;

import com.senai.ProjetoInterdisciplinar.config.IoLinkProperties.Porta;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Entende a resposta das APIs dos sensores sem depender de um formato fixo:
 * numero puro ("123"), hexadecimal ("022E"), true/false, ou JSON com o valor em algum campo.
 */
public final class InterpretadorResposta {

    private static final List<String> CAMPOS_COMUNS =
            List.of("valor", "value", "dado", "leitura", "distancia", "capacitivo", "indutivo", "data");

    private InterpretadorResposta() {
    }

    /** Acha o valor dentro da resposta. "campo" (opcional) e o nome do campo JSON que o contem. */
    public static String extrairValor(String corpo, String campo, int porta) {
        String texto = corpo == null ? "" : corpo.trim();
        if (texto.isEmpty()) {
            throw new IoLinkException("Resposta vazia na porta " + porta);
        }
        if (!texto.startsWith("{") && !texto.startsWith("[")) {
            return texto.replace("\"", ""); // texto simples: so o valor
        }

        List<String> campos = campo != null && !campo.isBlank() ? List.of(campo.trim()) : CAMPOS_COMUNS;
        for (String c : campos) {
            Matcher m = Pattern
                    .compile("\"" + Pattern.quote(c) + "\"\\s*:\\s*\"?([^\"{\\[,}\\]\\s][^\",}\\]\\s]*)",
                            Pattern.CASE_INSENSITIVE)
                    .matcher(texto);
            if (m.find() && !m.group(1).equalsIgnoreCase("null")) {
                return m.group(1);
            }
        }
        if (texto.startsWith("[")) {
            Matcher m = Pattern.compile("^\\[\\s*\"?([^\",\\]\\s]+)").matcher(texto);
            if (m.find()) {
                return m.group(1);
            }
        }
        throw new IoLinkException("Nao achei o valor na resposta da porta " + porta + ". Resposta: "
                + resumo(texto) + " (informe o nome do campo em iolink.portas[x].campo)");
    }

    /** Resposta no formato do mestre IO-Link: {"cid":-1,"data":{"value":"1F1D"},"code":200}. O valor e sempre hexadecimal. */
    public static boolean formatoMestre(String corpo) {
        return corpo != null && corpo.contains("\"cid\"") && corpo.contains("\"data\"");
    }

    /** Campo "code" da resposta, se existir (200 = ok). */
    public static Integer codigo(String corpo) {
        if (corpo == null) {
            return null;
        }
        Matcher m = Pattern.compile("\"code\"\\s*:\\s*(\\d+)").matcher(corpo);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    public static String paraHex(String valor, Porta p) {
        return paraHex(valor, p, null);
    }

    /**
     * Converte o valor para o hexadecimal usado internamente. Valor com letras A-F (ou 0x...) e
     * tratado como hexadecimal; numero comum e decimal (multiplicado por "escala" e arredondado).
     * "hexadecimal" na configuracao forca um dos dois; "forcarHex" (usado quando a resposta tem o
     * formato do mestre) vale quando a configuracao nao diz nada. Sem nenhum dos dois, um valor so
     * com digitos (ex.: 2753) e lido como decimal.
     */
    public static String paraHex(String valor, Porta p, Boolean forcarHex) {
        String v = valor.trim();
        if (v.equalsIgnoreCase("true")) {
            v = "1";
        } else if (v.equalsIgnoreCase("false")) {
            v = "0";
        }

        boolean prefixoHex = v.startsWith("0x") || v.startsWith("0X");
        if (prefixoHex) {
            v = v.substring(2);
        }

        boolean ehHex;
        if (prefixoHex) {
            ehHex = true;
        } else if (p.getHexadecimal() != null) {
            ehHex = p.getHexadecimal();
        } else if (forcarHex != null) {
            ehHex = forcarHex;
        } else {
            ehHex = v.matches("[0-9a-fA-F]+") && v.matches(".*[a-fA-F].*");
        }

        if (ehHex) {
            v = v.toUpperCase();
            return v.length() % 2 == 0 ? v : "0" + v;
        }

        double numero;
        try {
            numero = Double.parseDouble(v.replace(',', '.'));
        } catch (NumberFormatException e) {
            throw new IoLinkException("Valor nao numerico na porta " + p.getNumero() + ": " + v);
        }
        long inteiro = Math.round(numero * p.getEscala());
        int tam = Math.min(4, Math.max(1, p.getTamanhoBytes()));
        long mascara = (1L << (tam * 8)) - 1;
        return "00".repeat(Math.max(0, p.getByteIndex()))
                + String.format("%0" + (tam * 2) + "X", inteiro & mascara);
    }

    /** Resposta em uma linha, cortada em 200 caracteres. */
    public static String resumo(String corpo) {
        if (corpo == null) {
            return "";
        }
        String t = corpo.replaceAll("\\s+", " ").trim();
        return t.length() > 200 ? t.substring(0, 200) + "..." : t;
    }
}
