package com.senai.ProjetoInterdisciplinar.service;

public class IoLinkException extends RuntimeException {

    public IoLinkException(String mensagem) {
        super(mensagem);
    }

    public IoLinkException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
