package com.senai.ProjetoInterdisciplinar.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Detecta presenca em sensores analogicos sem precisar saber o valor "sem peca" de antemao.
 *
 * Aprende uma linha de base (o valor com a esteira livre) e considera o sensor ativo quando
 * o valor se afasta "delta" dela. Por padrao a peca faz o valor SUBIR; com "invertido" a peca
 * faz o valor CAIR (sensor que mede distancia ate a peca e manda um valor de "fora de alcance"
 * quando esta livre). Para nao tremer no limite, usa histerese: depois de ativar, so desativa
 * quando volta a menos de 60 % do delta. A linha de base acompanha rapido o movimento em direcao
 * ao lado "livre" (se o primeiro valor lido tinha uma peca na frente, ela se corrige) e se move
 * bem devagar para o lado da peca, so com o sensor livre, para acompanhar variacoes lentas de
 * temperatura e umidade.
 *
 * Premissa: ao ligar a aplicacao, a esteira esta livre.
 */
@Component
public class DetectorAnalogico {

    private static final double HISTERESE = 0.6;
    private static final double DERIVA_LENTA = 0.002;
    private static final double CORRECAO_RAPIDA = 0.3;

    private final Map<Integer, Double> linhaBase = new ConcurrentHashMap<>();
    private final Map<Integer, Boolean> ativo = new ConcurrentHashMap<>();

    /** Sensor em que a peca faz o valor subir (o caso comum). */
    public boolean atualizar(int porta, long valor, double delta) {
        return atualizar(porta, valor, delta, false);
    }

    /**
     * @param invertido true = a peca faz o valor CAIR em relacao ao valor livre
     */
    public boolean atualizar(int porta, long valor, double delta, boolean invertido) {
        double base = linhaBase.getOrDefault(porta, (double) valor);
        boolean estavaAtivo = ativo.getOrDefault(porta, false);

        // "desvio" positivo = o valor foi para o lado da peca
        double desvio = invertido ? base - valor : valor - base;
        boolean agora = estavaAtivo ? desvio >= delta * HISTERESE : desvio >= delta;

        if (!agora) {
            boolean paraOLadoLivre = desvio < 0;
            base += (valor - base) * (paraOLadoLivre ? CORRECAO_RAPIDA : DERIVA_LENTA);
        }
        linhaBase.put(porta, base);
        ativo.put(porta, agora);
        return agora;
    }

    /** Sem estado: o valor, comparado a linha de base ja aprendida, esta do lado da peca? */
    public boolean acimaDoLimite(double base, long valor, double delta, boolean invertido) {
        return invertido ? valor <= base - delta : valor >= base + delta;
    }

    /** Valor aprendido para a esteira livre (null antes da primeira leitura). */
    public Double getLinhaBase(int porta) {
        return linhaBase.get(porta);
    }
}
