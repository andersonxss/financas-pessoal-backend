# Amazon MQ com Floci no Sistema de Finanças

Use este tutorial para executar o NestJS com um broker RabbitMQ provisionado pelo Amazon MQ emulado no Floci. O roteiro usa PowerShell no Windows e reaproveita o PostgreSQL, o Redis e as migrations do Docker Compose do projeto.

O Floci expõe a **API de gerenciamento** em `http://localhost:4566`. Ao receber a solicitação de criação, ele inicia um contêiner RabbitMQ com portas próprias. O NestJS usa **AMQP** para publicar e consumir mensagens pelo `RABBITMQ_URI`. [Documentação do Amazon MQ no Floci](https://floci.io/floci/services/amazonmq/)

## 1. Iniciar o Floci

Abra o Docker Desktop em modo de contêineres Linux e use o PowerShell. Confira se a AWS CLI v2 está disponível e se o Floci já existe.

```powershell
docker info --format '{{.OSType}}'
aws --version
docker ps -a --filter 'name=^/floci$'
```

Se `floci` estiver em execução, siga para a etapa 2. Se estiver parado, execute `docker start floci`. Se ainda não existir, crie-o com o comando abaixo. O socket permite que o Floci crie o contêiner do broker. O mapeamento da porta `4566` limita o acesso à API do Floci à sua máquina. [Configuração do Docker no Floci](https://floci.io/floci/configuration/docker/)

```powershell
docker run -d --name floci -p 127.0.0.1:4566:4566 -v /var/run/docker.sock:/var/run/docker.sock floci/floci:latest
```

## 2. Criar um broker RabbitMQ no Amazon MQ local

Use o mesmo terminal para os comandos `aws mq` do tutorial. As chaves fictícias valem só para a sessão do PowerShell. Cada comando informa o endereço local do Floci. [Configuração da AWS CLI para o Floci](https://floci.io/floci/getting-started/aws-setup/)

```powershell
$env:AWS_ACCESS_KEY_ID = 'test'
$env:AWS_SECRET_ACCESS_KEY = 'test'
$env:AWS_SESSION_TOKEN = $null
aws mq list-brokers --endpoint-url http://127.0.0.1:4566 --region us-east-1 --no-cli-pager --output json
```

Crie o broker `sistema-finance-local` em modo `SINGLE_INSTANCE`. Cole o comando de criação inteiro em uma linha no PowerShell. O usuário `finance_local` e a senha `FinanceLocal123` são credenciais de exemplo para o RabbitMQ local. Se esse broker já estiver na lista, atribua o `BrokerId` exibido a `$brokerId` e pule a criação. [Referência de `aws mq create-broker`](https://docs.aws.amazon.com/cli/latest/reference/mq/create-broker.html)

```powershell
$brokerId = aws mq create-broker --endpoint-url http://127.0.0.1:4566 --region us-east-1 --no-cli-pager --broker-name sistema-finance-local --engine-type RABBITMQ --engine-version 3.13 --deployment-mode SINGLE_INSTANCE --host-instance-type mq.t3.micro --no-publicly-accessible --auto-minor-version-upgrade --users 'Username=finance_local,Password=FinanceLocal123,ConsoleAccess=true' --query BrokerId --output text
$brokerId
```

Consulte o estado e repita o comando até receber `RUNNING`. Se o broker ficar em `CREATION_FAILED`, consulte `docker logs floci` antes de continuar.

```powershell
aws mq describe-broker --endpoint-url http://127.0.0.1:4566 --region us-east-1 --no-cli-pager --broker-id $brokerId --query BrokerState --output text
```

## 3. Identificar as portas publicadas pelo broker

```powershell
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

Identifique o novo contêiner RabbitMQ criado pelo Floci. O contêiner `rabbitmq-finance` é o broker do Compose padrão. Preste atenção no número à esquerda de `->`. No exemplo abaixo, o NestJS usa `5673` e o navegador abre o painel em `http://localhost:15673`.

| Mapeamento de exemplo | Para que serve |
| --- | --- |
| `0.0.0.0:5673->5672/tcp` | Porta AMQP publicada no Windows |
| `0.0.0.0:15673->15672/tcp` | Porta do painel RabbitMQ publicada no Windows |

Os números podem variar. Se o RabbitMQ padrão já estiver usando `5672` e `15672`, o Floci tenta as próximas portas livres. O IP retornado por `describe-broker` pode pertencer à rede interna do Docker. Para este tutorial, use as portas publicadas que aparecem no `docker ps`. [Mapeamento de portas do Amazon MQ no Floci](https://floci.io/floci/services/amazonmq/#how-it-works)

## 4. Iniciar a API com o broker do Floci

Use a pasta `server-nestjs` e a configuração de desenvolvimento da aplicação. Se o arquivo `.env` ainda não existir, crie-o a partir de `.env.example` e preencha os valores de desenvolvimento do seu ambiente.

```powershell
Set-Location 'C:\dev\financeSistem\server-nestjs'
docker compose stop api
docker compose up -d --wait postgres redis-finance
docker compose up -d --build postgres-role-init
docker compose wait postgres-role-init
docker compose ps -a migrate postgres-role-init
```

Os serviços `migrate` e `postgres-role-init` devem aparecer como `Exited (0)`. O Compose executa a migration antes do provisionamento das permissões do usuário da API. Se algum dos serviços falhar, veja `docker compose logs migrate postgres-role-init`.

Agora informe a porta **AMQP publicada** identificada na etapa 3. Se você reutilizou um broker com outras credenciais, ajuste também o usuário e a senha na URI. O Docker Desktop fornece `host.docker.internal` para o contêiner da API alcançar essa porta no Windows. [Rede do Docker Desktop](https://docs.docker.com/desktop/features/networking/networking-how-tos/#connect-a-container-to-a-service-on-the-host)

```powershell
$amqpPort = [int](Read-Host 'Porta AMQP publicada no Windows')
$brokerUri = "amqp://finance_local:FinanceLocal123@host.docker.internal:$amqpPort"
docker compose run --rm --no-deps --service-ports -e "RABBITMQ_URI=$brokerUri" api
```

Esse comando inicia uma instância temporária da API em primeiro plano. `-e` substitui o endereço do RabbitMQ definido em `docker-compose.yml`, `--no-deps` usa os serviços que você já preparou e `--service-ports` publica a porta padrão da API, `3333`, ou a que você definiu em `PORT`. [Referência de `docker compose run`](https://docs.docker.com/reference/cli/docker/compose/run/)

## 5. Testar pelo fluxo de importação

Se o frontend estiver parado, abra outro terminal, entre em `C:\dev\financeSistem\front` e execute `npm install` caso ainda faltem as dependências. Rode `npm run dev` e abra `http://localhost:5173`. O frontend usa `http://localhost:3333` por padrão. Se você publicou a API em outra porta, ajuste `VITE_API_BASE_URL` no ambiente do frontend.

1. Abra o painel RabbitMQ na porta publicada na etapa 3 e entre com `finance_local` e `FinanceLocal123`, ou com as credenciais usadas na criação do broker.
2. Abra a aba **Queues and Streams**. Quando o NestJS terminar de iniciar, procure `process_despesa` e `process_receita`. Cada fila deve mostrar um consumidor da API.
3. No frontend, entre com um usuário local de teste. Importe um extrato fictício compatível com o fluxo de extração, revise os lançamentos e confirme. Se precisar criar o primeiro usuário do ambiente, consulte a seção de bootstrap da referência de autenticação. [Fluxo de extração](extracao-extrato-receitas.md) · [Autenticação e tenants](auth-multitenancy.md)
4. Confira a atividade de publicação e entrega na aba da fila correspondente. O contador de mensagens prontas pode permanecer em zero quando o consumidor processa rapidamente. Verifique também se as despesas e receitas apareceram nas respectivas telas para o mesmo usuário.

O teste usa os consumidores registrados no bootstrap do NestJS e confirma o fluxo até a gravação no PostgreSQL. Se a API falhar ao iniciar, confira se o broker chegou a `RUNNING`, se a URI aponta para a **porta AMQP** publicada e se as credenciais correspondem ao broker criado.

## 6. Voltar ao RabbitMQ do Compose

Encerre a API temporária com `Ctrl+C`. Se você terminou o teste e quer descartar o broker criado neste tutorial, rode o comando abaixo na mesma sessão do PowerShell. A exclusão remove o broker e suas filas e mensagens de teste. Ela também libera as portas caso o Floci tenha usado `5672` ou `15672`.

```powershell
aws mq delete-broker --endpoint-url http://127.0.0.1:4566 --region us-east-1 --no-cli-pager --broker-id $brokerId
```

Na pasta `server-nestjs`, inicie a API padrão. O Compose volta a usar `rabbitmq-finance` com os volumes originais.

```powershell
docker compose up -d api
```
