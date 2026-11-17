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
    private long intervaloMs = 20;
    /** De quanto em quanto tempo a porta do sensor de distancia (nivel) e lida (ms). Ela e lenta e nao precisa de pressa. */
    private long nivelIntervaloMs = 1000;
    /** Tempo sem resposta do mestre para a esteira ser considerada parada. */
    private long offlineAposMs = 5000;
    /** De quanto em quanto tempo o sensor de distancia e gravado no historico (ms). */
    private long historicoMinMs = 10000;
    /** Grava tambem, a cada mudanca, os sensores de peca no historico (util so para depuracao). */
    private boolean historicoSensoresPeca = false;
<<<<<<< HEAD
    /**
     * Tempo com os dois sensores livres para considerar que a peca terminou de passar. O valor efetivo
     * nunca fica abaixo de 2,5 ciclos de leitura: se o ciclo for mais longo que isso, uma peca seria
     * "fechada" entre duas leituras e o indutivo (janela curta) poderia cair em outra passagem.
     */
=======
    /** Tempo com os dois sensores livres para considerar que a peca terminou de passar. */
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
    private long fimPecaMs = 300;
    /** Passagem mais longa que isso e tratada como sensor travado: conta uma peca e espera os sensores liberarem. */
    private long maxPecaMs = 5000;
    private List<Porta> portas = new ArrayList<>();

    @Data
    public static class Porta {
        private int numero;
        private String nome;
        private FuncaoPorta funcao;

        /**
         * Endereco da API deste sensor (ex.: http://10.110.12.76:5000/sensores/indutivo).
         * Se vazio, o sensor e lido do mestre IO-Link pelo base-url.
         */
        private String url;
        /** Nome do campo JSON que traz o valor (opcional: o projeto tenta nomes comuns). */
        private String campo;
        /** Forca a leitura como hexadecimal (true) ou decimal (false). Vazio = detecta pelas letras A-F. */
        private Boolean hexadecimal;
        /** Valor decimal x escala vira o inteiro lido (ex.: 12,5 com escala 10 = 125). */
        private double escala = 1.0;

        /** Posicao do dado dentro do process data (hex) devolvido pelo mestre. */
        private int byteIndex = 0;

        // sensores de peca
        /**
         * Sensor que manda um valor analogico (16 bits): esta ativo quando o valor bruto e maior ou
         * igual ao limiar (tamanho-bytes, byte-index e com-sinal dizem como ler o valor).
         * Deixe sem valor para usar o bit-index (sensor que manda so um bit).
         */
        private Double limiar;
<<<<<<< HEAD

        /**
         * Alternativa ao limiar fixo para sensores analogicos: o projeto aprende sozinho o valor
         * com a esteira livre e considera o sensor ativo quando o valor sobe "delta" acima dele.
         * Se informado, vale no lugar do limiar. Com "invertido=true" o sensor e ativo quando o valor CAI
         * "delta" abaixo do valor livre (ex.: sensor que manda 32736 = fora de alcance e cai ao ver metal).
         */
        private Double delta;
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
        private int bitIndex = 0;
        /** Sensor em que a presenca faz o valor cair (vale para limiar, delta e bit). */
        private boolean invertido = false;

        /**
         * Segunda testemunha de metal, opcional, para o sensor que enxerga qualquer peca: se o valor mais
         * extremo dele durante a passagem chegar a este valor (>= se a peca sobe o valor, <= se invertido),
         * a peca e METALICA mesmo que o indutivo nao tenha sido amostrado. Resolve o caso do indutivo, de
         * alcance curto, ser lido 0 ou 1 vez enquanto o outro e lido 3.
         */
        private Double limiarMetal;

        // sensor de nivel (analogico)
        private int tamanhoBytes = 2;
        private boolean comSinal = false;
        /** Valor bruto que corresponde a 0 % e a 100 % do reservatorio. */
        private double valorVazio = 0;
        private double valorCheio = 100;
    }
}
