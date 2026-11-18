-- MetalTech - banco de dados do projeto (MySQL)
-- Opcional: o Spring Boot ja cria tudo sozinho ao iniciar (ddl-auto=update).
-- Use este script se quiser criar o banco antes, pelo MySQL Workbench.

CREATE DATABASE IF NOT EXISTS metaltech
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE metaltech;

-- ---------------------------------------------------------------
-- Se voce ja rodou uma versao antiga do projeto, descomente estas
-- duas linhas UMA vez para recomear com as tabelas limpas:
-- DROP TABLE IF EXISTS leitura_sensor;
-- DELETE FROM leitura;
-- ---------------------------------------------------------------

-- Uma linha por peca que terminou de passar pela esteira
-- (indutivo pegou = METALICA; so o capacitivo pegou = NAO_METALICA)
-- Nos sensores em que a peca faz o valor CAIR (invertido=true), as colunas guardam o MENOR valor da passagem.
CREATE TABLE IF NOT EXISTS leitura (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  data_hora          DATETIME(6)  NOT NULL,
  tipo_peca          VARCHAR(20)  NOT NULL,   -- METALICA ou NAO_METALICA
  nivel_reservatorio DOUBLE       NOT NULL,   -- 0 a 100 (%)
  hex_indutivo       VARCHAR(16)  NULL,       -- maior valor do indutivo na passagem (hex, como chegou)
  valor_indutivo     BIGINT       NULL,       -- o mesmo valor em decimal
  hex_capacitivo     VARCHAR(16)  NULL,       -- maior valor do capacitivo na passagem (hex)
  valor_capacitivo   BIGINT       NULL,       -- o mesmo valor em decimal
  PRIMARY KEY (id),
  INDEX idx_leitura_data_hora (data_hora)
);

-- Se a tabela "leitura" ja existia sem essas 4 colunas, o Spring as adiciona sozinho ao subir.
-- Para adicionar pelo Workbench:
-- ALTER TABLE leitura ADD COLUMN hex_indutivo VARCHAR(16) NULL, ADD COLUMN valor_indutivo BIGINT NULL,
--   ADD COLUMN hex_capacitivo VARCHAR(16) NULL, ADD COLUMN valor_capacitivo BIGINT NULL;

-- Historico do sensor de distancia (porta 1), uma linha a cada 10 s
CREATE TABLE IF NOT EXISTS leitura_sensor (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  data_hora        DATETIME(6)  NOT NULL,
  porta            INT          NOT NULL,     -- 1, 2 ou 3
  funcao           VARCHAR(30)  NOT NULL,     -- NIVEL_RESERVATORIO, SENSOR_INDUTIVO, SENSOR_CAPACITIVO
  hex              VARCHAR(64)  NOT NULL,     -- process data como chegou do mestre
  valor_bruto      BIGINT       NULL,         -- valor em decimal (ex.: distancia)
  ativo            BIT          NULL,         -- sensor de peca detectando
  nivel_percentual DOUBLE       NULL,         -- 0 a 100 (%)
  PRIMARY KEY (id),
  INDEX idx_leitura_sensor_data_hora (data_hora)
);

-- VALIDACAO: o banco guarda, para cada peca, o valor mais extremo de cada sensor na passagem. Se a classificacao
-- estiver certa, as faixas de cada tipo_peca NAO podem se misturar. Exemplos (valores medidos no laboratorio):
--   indutivo "sobe": livre 558, plastico 1925..2711, metal 7367..7921
-- SELECT tipo_peca, COUNT(*) AS qtd,
--        MIN(valor_indutivo) AS ind_min, MAX(valor_indutivo) AS ind_max,
--        MIN(valor_capacitivo) AS cap_min, MAX(valor_capacitivo) AS cap_max
--   FROM leitura GROUP BY tipo_peca;
-- Onde as classes se misturam (agrupa o pico do capacitivo em faixas de 1000). Com a classificacao certa, cada
-- tipo_peca ocupa faixas diferentes; NAO_METALICA aparecendo na faixa onde so ha METALICA = metal que o indutivo
-- nao enxergou (amostragem lenta ou sensores trocados):
-- SELECT tipo_peca, ROUND(valor_capacitivo, -3) AS faixa_capacitivo, COUNT(*) AS qtd
--   FROM leitura GROUP BY tipo_peca, faixa_capacitivo ORDER BY faixa_capacitivo, tipo_peca;

-- Para conferir os dados:
-- SELECT * FROM leitura_sensor ORDER BY data_hora DESC LIMIT 20;
-- SELECT data_hora, tipo_peca, hex_indutivo, valor_indutivo, hex_capacitivo, valor_capacitivo FROM leitura ORDER BY data_hora DESC LIMIT 20;
-- SELECT tipo_peca, COUNT(*) FROM leitura GROUP BY tipo_peca;