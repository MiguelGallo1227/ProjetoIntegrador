package com.senai.ProjetoInterdisciplinar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Uma peca que passou pela esteira, junto com o nivel do reservatorio naquele momento. */
@Entity
@Table(name = "leitura", indexes = @Index(name = "idx_leitura_data_hora", columnList = "data_hora"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Leitura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private Instant dataHora;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_peca", nullable = false, length = 20)
    private TipoPeca tipoPeca;

    @Column(name = "nivel_reservatorio", nullable = false)
    private Double nivelReservatorio;
}
