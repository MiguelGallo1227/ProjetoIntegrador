
CREATE DATABASE IF NOT EXISTS metaltech
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE metaltech;

CREATE TABLE IF NOT EXISTS leitura (
    id BIGINT NOT NULL AUTO_INCREMENT,
    data_hora DATETIME(6) NOT NULL,
    tipo_peca VARCHAR(20) NOT NULL,
    nivel_reservatorio DOUBLE NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_leitura_data_hora (data_hora)
);
