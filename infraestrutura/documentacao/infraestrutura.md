# Infraestrutura do Projeto MetalTech

## 1. Banco de dados

O projeto MetalTech utiliza o **MySQL 8.0** como sistema de gerenciamento de banco de dados.

O banco de dados utilizado pela aplicação possui o nome `metaltech` e armazena as informações das leituras realizadas pela esteira.

## 2. Conteinerização

Foi utilizado o Docker Desktop para executar o MySQL em um container, facilitando a configuração e a execução do banco de dados.

O container é configurado por meio do arquivo `docker-compose.yml`, que define a imagem do MySQL, as variáveis de ambiente, as portas de acesso e o armazenamento persistente.

## 3. Persistência dos dados

Foi configurado um volume Docker chamado `mysql_data`, responsável por manter os dados do banco mesmo quando o container é reiniciado ou recriado.

## 4. Inicialização do banco

O arquivo `database/init.sql` contém os comandos SQL responsáveis pela criação do banco de dados e da tabela `leitura`, seguindo a estrutura utilizada pela entidade Java `Leitura`.

## 5. Verificação de funcionamento

O Docker Compose possui uma configuração de *healthcheck* para verificar se o serviço MySQL está funcionando corretamente.

O container foi iniciado com sucesso e apresentou o estado `healthy`.
## 6. Conteinerização do backend

O backend do projeto MetalTech foi desenvolvido em Java com Spring Boot e também foi configurado para execução em um container Docker.

Foi utilizado um arquivo `Dockerfile`, responsável por criar a imagem da aplicação a partir do ambiente Java 21 e executar o arquivo `app.jar`.

O serviço é configurado no arquivo `docker-compose.yml`, utilizando a porta 8080 para acesso à aplicação.

## 7. Comunicação entre os serviços

O backend Java e o banco de dados MySQL são executados em containers separados, conectados pela rede interna criada pelo Docker Compose.

A comunicação entre eles é realizada por meio do endereço `database:3306`, permitindo que o backend acesse o banco de dados `metaltech`.

A conexão foi testada e confirmada por meio dos logs do Spring Boot, que demonstraram o estabelecimento da conexão com o MySQL.