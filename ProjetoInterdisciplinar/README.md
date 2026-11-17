# Back-end da esteira de triagem (Spring Boot)

Consulta o mestre IO-Link (`10.110.12.41`, portas 1, 2 e 3), conta as peças, guarda as leituras no banco
e entrega tudo para o dashboard React pela API REST.

**Stack:** Java 25, Spring Boot 4, Spring Web MVC, Spring Data JPA, MySQL, Lombok.

## Como funciona
<<<<<<< HEAD
1. A cada ciclo o `ColetaService` lê a API de cada sensor (`iolink.portas[x].url`) ou, se a porta não tiver `url`, lê `http://10.110.12.41/iolinkmaster/port[N]/iolinkdevice/pdin/getdata` das 3 portas.
=======
1. A cada 500 ms o `ColetaService` lê `http://10.110.12.41/iolinkmaster/port[N]/iolinkdevice/pdin/getdata` das 3 portas.
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
2. Peças: o sensor indutivo (porta 2, embaixo) só detecta metal e o capacitivo (porta 3, em cima) detecta qualquer peça.
   Se o indutivo pegou durante a passagem, a peça é metálica; se só o capacitivo pegou, é não metálica. Cada peça vira uma `Leitura`.
3. Porta 1 (sensor de distância no fim da esteira): o valor bruto vira 0–100 % e é gravado junto com cada peça e a cada 10 s em `leitura_sensor`.
4. O dashboard consome a API (contrato do README do `metaltech-dashboard`).

## Endpoints
| Método | Rota | Para quê |
|---|---|---|
| GET | `/api/esteira/status` | status, contagem do dia e nível atual |
| GET | `/api/leituras?limite=200` | últimas leituras, ordem crescente |
| GET | `/api/iolink/portas` | última leitura de cada porta (hex + valor decodificado), atualizada a cada 500 ms |
| GET | `/` | página que mostra tudo isso ao vivo (atualiza a cada 1 s) |

## Como rodar
**Sem o mestre e sem MySQL** (dados simulados + banco em memória):
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=h2 --iolink.simulado=true"
```
**No laboratório** (mestre real + MySQL): ajuste `DB_HOST`, `DB_USER` e `DB_PASSWORD` (padrão: `localhost`, `root`, senha vazia)
e rode `./mvnw spring-boot:run`. O banco `metaltech` e as tabelas são criados sozinhos.

No dashboard: `VITE_USE_MOCK=false` e `VITE_API_URL=http://localhost:8080` no `.env`.

## Ajustando os sensores
No `application.properties` cada porta tem uma função e a posição do dado dentro do process data:
- `funcao`: `NIVEL_RESERVATORIO` (distância), `SENSOR_INDUTIVO` ou `SENSOR_CAPACITIVO`.
<<<<<<< HEAD
- Sensor de peça com `delta` (o caso dos seus): o projeto aprende sozinho o valor com a esteira livre e o sensor "pega" quando o valor sobe `delta` acima dele. Ligue a aplicação com a esteira livre.
- `invertido`: vale também com `delta`. Use quando a presença faz o valor **cair** (ex.: sensor que manda 32736 = fora de alcance livre e cai para ~10039 com metal).
- `limiar-metal` (opcional, no sensor que enxerga qualquer peça): se o pico dele na passagem chegar a esse valor, a peça é metálica mesmo que o indutivo (alcance curto) não tenha sido amostrado. Nunca rebaixa uma peça metálica.
- Amostragem: só os sensores de peça entram no ciclo (`iolink.intervalo-ms`, padrão 20 ms); a distância é lida em segundo plano a cada `iolink.nivel-intervalo-ms`. O fim de passagem nunca é menor que 2,5 ciclos. Confira o período real em `GET /api/diagnostico` (`periodoAmostragemMs`).
=======
>>>>>>> 9181f098cf18e49285f3a4d7478ad2f79bfb6466
- Sensor de peça: se ele manda um valor analógico (é o caso dos seus), use `byte-index`, `tamanho-bytes` e `limiar` (ativo quando o valor for maior ou igual ao limiar). Se mandar só um bit, use `bit-index` e deixe o `limiar` de fora. `invertido` troca o resultado.
- Sensor de nível: `byte-index`, `tamanho-bytes`, `com-sinal`, `valor-vazio` e `valor-cheio` (valor bruto que vale 0 % e 100 %).

Para descobrir os valores certos, abra `GET /api/iolink/portas` com o sensor ativo e inativo e compare o `hex`.
