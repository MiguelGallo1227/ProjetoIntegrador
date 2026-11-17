package com.senai.ProjetoInterdisciplinar.service;

/**
 * O que chegou de um sensor: o valor em hexadecimal (formato interno do projeto) e um resumo
 * da resposta original da API, para aparecer na tela e ajudar a conferir o formato.
 */
public record LeituraBruta(String hex, String resposta) {
}
