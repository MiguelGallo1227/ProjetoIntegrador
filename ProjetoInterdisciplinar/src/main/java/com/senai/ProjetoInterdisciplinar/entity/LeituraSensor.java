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

/**
 * Historico do sensor de distancia: uma linha a cada iolink.historico-min-ms (padrao 10 s),
 * com o hex como chegou do mestre, o valor bruto e o nivel em %.
 */
@Entity
@Table(name = "leitura_sensor", indexes = @Index(name = "idx_leitura_sensor_data_hora", columnList = "data_hora"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeituraSensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private Instant dataHora;

    @Column(nullable = false)
    private Integer porta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FuncaoPorta funcao;

    /** Process data exatamente como chegou do mestre (hexadecimal). */
    @Column(nullable = false, length = 64)
    private String hex;

    /** Sensor de distancia/nivel: valor bruto em decimal. */
    @Column(name = "valor_bruto")
    private Long valorBruto;

    /** Sensores de peca: true = detectando. */
    private Boolean ativo;

    /** Sensor de nivel: 0..100 %. */
    @Column(name = "nivel_percentual")
    private Double nivelPercentual;
}
