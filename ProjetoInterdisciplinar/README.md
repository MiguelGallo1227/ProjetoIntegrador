# Back-end da esteira de triagem (Spring Boot)

Consulta o mestre IO-Link (`10.110.12.41`, portas 1, 2 e 3), conta as peças, guarda as leituras no banco
e entrega tudo para o dashboard React pela API REST.

**Stack:** Java 25, Spring Boot 4, Spring Web MVC, Spring Data JPA, SQL Server, Lombok.

## Como funciona
1. A cada 500 ms o `ColetaService` lê `http://10.110.12.41/iolinkmaster/port[N]/iolinkdevice/pdin/getdata` das 3 portas.
2. Porta de peça (metálica / não metálica): quando o sensor vai de inativo para ativo, conta uma peça e salva uma `Leitura`.
3. Porta de nível: o valor bruto vira 0–100 % e é gravado junto com cada peça.
4. O dashboard consome a API (contrato do README do `metaltech-dashboard`).

## Endpoints
| Método | Rota | Para quê |
|---|---|---|
| GET | `/api/esteira/status` | status, contagem do dia e nível atual |
| GET | `/api/leituras?limite=200` | últimas leituras, ordem crescente |
| GET | `/api/iolink/portas` | leitura ao vivo das 3 portas (hex + valor decodificado) |

## Como rodar
**Sem o mestre e sem SQL Server** (dados simulados + banco em memória):
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=h2 --iolink.simulado=true"
```
**No laboratório** (mestre real + SQL Server): ajuste `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
(ou o `application.properties`) e rode `./mvnw spring-boot:run`. Crie o banco `metaltech` antes; as tabelas são criadas sozinhas.

No dashboard: `VITE_USE_MOCK=false` e `VITE_API_URL=http://localhost:8080` no `.env`.

## Ajustando os sensores
No `application.properties` cada porta tem uma função e a posição do dado dentro do process data:
- `funcao`: `PECA_METALICA`, `PECA_NAO_METALICA` ou `NIVEL_RESERVATORIO` (assumi porta 1, 2 e 3 nessa ordem; troque se for diferente).
- Sensor de peça: `byte-index`, `bit-index` e `invertido`.
- Sensor de nível: `byte-index`, `tamanho-bytes`, `com-sinal`, `valor-vazio` e `valor-cheio` (valor bruto que vale 0 % e 100 %).

Para descobrir os valores certos, abra `GET /api/iolink/portas` com o sensor ativo e inativo e compare o `hex`.
