-- Rode no console do MySQL (Railway > MySQL > Data/Connect).
-- No Railway o banco já existe (geralmente chamado "railway"): nesse caso pule
-- as 2 primeiras linhas e rode só o CREATE TABLE no banco que já está selecionado.
CREATE DATABASE IF NOT EXISTS iot_db CHARACTER SET utf8mb4;
USE iot_db;

CREATE TABLE IF NOT EXISTS leituras (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  temperatura FLOAT        NULL,                 -- DHT22 (°C)
  umidade     FLOAT        NULL,                 -- DHT22 (%)
  atleta      TINYINT UNSIGNED NULL,             -- nº de peito (só em leitura de tag)
  ponto       TINYINT UNSIGNED NULL,             -- 0 Largada, 1 KM 3, 2 KM 7, 3 KM 11, 4 KM 13, 5 Chegada
  tag         CHAR(1)      NULL,                 -- 'A' ou 'B'
  bpm         SMALLINT UNSIGNED NULL,            -- simulado
  rssi        SMALLINT     NULL,                 -- sinal WiFi (dBm)
  data_hora   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,   -- gravado em UTC pela API
  INDEX idx_data_hora (data_hora),
  INDEX idx_atleta_ponto (atleta, ponto)
) ENGINE=InnoDB;
