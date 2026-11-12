-- Opcional: o Spring Boot ja cria tudo sozinho ao iniciar (ddl-auto=update).
-- Use este script se quiser criar o banco antes, pelo MySQL Workbench.

CREATE DATABASE IF NOT EXISTS metaltech
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE metaltech;

CREATE TABLE IF NOT EXISTS leitura (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  data_hora          DATETIME(6)  NOT NULL,
  tipo_peca          VARCHAR(20)  NOT NULL,   -- METALICA ou NAO_METALICA
  nivel_reservatorio DOUBLE       NOT NULL,   -- 0 a 100 (%)
  PRIMARY KEY (id),
  INDEX idx_leitura_data_hora (data_hora)
);

-- Para conferir os dados depois:
-- SELECT * FROM leitura ORDER BY data_hora DESC LIMIT 20;