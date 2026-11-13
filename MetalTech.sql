


CREATE DATABASE IF NOT EXISTS metaltech
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE metaltech;

-- Uma linha por peca que passou na esteira
CREATE TABLE IF NOT EXISTS leitura (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  data_hora          DATETIME(6)  NOT NULL,
  tipo_peca          VARCHAR(20)  NOT NULL,   -- METALICA ou NAO_METALICA
  nivel_reservatorio DOUBLE       NOT NULL,   -- 0 a 100 (%)
  PRIMARY KEY (id),
  INDEX idx_leitura_data_hora (data_hora)
);

-- Historico do que chegou de cada porta do mestre IO-Link
CREATE TABLE IF NOT EXISTS leitura_sensor (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  data_hora        DATETIME(6)  NOT NULL,
  porta            INT          NOT NULL,     -- 1, 2 ou 3
  funcao           VARCHAR(30)  NOT NULL,     -- NIVEL_RESERVATORIO, SENSOR_INDUTIVO, SENSOR_CAPACITIVO
  hex              VARCHAR(64)  NOT NULL,     -- process data como chegou do mestre
  valor_bruto      BIGINT       NULL,         -- distancia em decimal (porta de nivel)
  ativo            BIT          NULL,         -- sensor de peca detectando
  nivel_percentual DOUBLE       NULL,         -- 0 a 100 (%)
  PRIMARY KEY (id),
  INDEX idx_leitura_sensor_data_hora (data_hora)
);

-- Para conferir os dados:
-- SELECT * FROM leitura_sensor ORDER BY data_hora DESC LIMIT 20;
-- SELECT * FROM leitura ORDER BY data_hora DESC LIMIT 20;