package com.senai.ProjetoInterdisciplinar.config;

import com.senai.ProjetoInterdisciplinar.entity.FuncaoPorta;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/** Configuracoes do mestre IO-Link (prefixo "iolink" no application.properties). */
@Data
@ConfigurationProperties(prefix = "iolink")
public class IoLinkProperties {

    /** true = gera dados falsos em vez de acessar o mestre. */
    private boolean simulado = false;
    private String baseUrl = "http://10.110.12.41";
    private int timeoutMs = 2000;
    private long intervaloMs = 500;
    /** Tempo sem resposta do mestre para a esteira ser considerada parada. */
    private long offlineAposMs = 5000;
    /** De quanto em quanto tempo o sensor de distancia e gravado no historico (ms). */
    private long historicoMinMs = 10000;
    /** Grava tambem, a cada mudanca, os sensores de peca no historico (util so para depuracao). */
    private boolean historicoSensoresPeca = false;
    /** Tempo com os dois sensores livres para considerar que a peca terminou de passar. */
    private long fimPecaMs = 300;
    /** Passagem mais longa que isso e tratada como sensor travado: conta uma peca e espera os sensores liberarem. */
    private long maxPecaMs = 5000;
    private List<Porta> portas = new ArrayList<>();

    @Data
    public static class Porta {
        private int numero;
        private String nome;
        private FuncaoPorta funcao;

        /** Posicao do dado dentro do process data (hex) devolvido pelo mestre. */
        private int byteIndex = 0;

        // sensores de peca
        /**
         * Sensor que manda um valor analogico (16 bits): esta ativo quando o valor bruto e maior ou
         * igual ao limiar (tamanho-bytes, byte-index e com-sinal dizem como ler o valor).
         * Deixe sem valor para usar o bit-index (sensor que manda so um bit).
         */
        private Double limiar;
        private int bitIndex = 0;
        private boolean invertido = false;

        // sensor de nivel (analogico)
        private int tamanhoBytes = 2;
        private boolean comSinal = false;
        /** Valor bruto que corresponde a 0 % e a 100 % do reservatorio. */
        private double valorVazio = 0;
        private double valorCheio = 100;
    }
}
