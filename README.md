# Finanças Pessoal — Backend

API para gestão financeira pessoal e multi-tenant, construída com NestJS. O
backend gerencia despesas, receitas, categorias, parcelas, pagamentos e
usuários, além de importar extratos e faturas em PDF e processar eventos de
forma assíncrona.

## Principais recursos

- autenticação JWT com access token e refresh token rotacionado;
- isolamento por tenant com RBAC e Row-Level Security (RLS) no PostgreSQL;
- separação de comandos e consultas com CQRS;
- cadastro e consolidação de despesas e receitas;
- importação de faturas e extratos bancários em PDF;
- extração determinística de lançamentos e extração opcional com Google GenAI;
- processamento assíncrono de eventos financeiros com RabbitMQ;
- cache segregado por tenant com Redis;
- comunicação em tempo real com Socket.IO;
- migrations e bootstrap controlado do primeiro administrador.

## Tecnologias

| Área | Tecnologia |
| --- | --- |
| Aplicação | Node.js 22, TypeScript, NestJS 11 |
| Padrões | CQRS, módulos NestJS, domínio e adaptadores de infraestrutura |
| Persistência | PostgreSQL 17, TypeORM, RLS |
| Mensageria | RabbitMQ, `amqplib` |
| Cache | Redis, `ioredis` |
| Tempo real | Socket.IO |
| PDFs e IA | `pdf-parse`, Google GenAI |
| Testes | Jest, ts-jest, Supertest |

## Arquitetura

O código está organizado para manter as regras de negócio separadas dos
detalhes de framework e infraestrutura:

```text
src/
├── application/     # commands, queries, DTOs, event bus e casos de uso
├── domain/          # entidades, eventos, erros, contratos e value objects
├── infrastructure/  # HTTP, autenticação, TypeORM, Redis, RabbitMQ, IA e e-mail
├── main/            # composição dos módulos NestJS
├── scripts/         # tarefas administrativas, como bootstrap do administrador
└── main.ts          # bootstrap HTTP, CORS, validação e consumidores de eventos
```

```mermaid
flowchart LR
    Client[Frontend / cliente] -->|HTTP e Socket.IO| API[NestJS]
    API --> Security[JWT, RBAC e Tenant Context]
    Security --> CQRS[Command Bus / Query Bus]
    CQRS --> Domain[Domínio]
    CQRS --> Persistence[TypeORM]
    Persistence --> PostgreSQL[(PostgreSQL + RLS)]
    CQRS --> Cache[(Redis)]
    CQRS --> Events[Event Bus]
    Events <--> RabbitMQ[(RabbitMQ)]
    API --> Upload[Importação de PDF]
    Upload --> Extractor[Parser local / Google GenAI]
```

As requisições autenticadas recebem um contexto de tenant. Esse contexto é
propagado para a transação do PostgreSQL e para os recursos de infraestrutura,
evitando que dados de tenants diferentes sejam compartilhados.

## Pré-requisitos

Para executar todo o ambiente com Docker:

- Docker Engine ou Docker Desktop;
- Docker Compose v2.

Para executar o backend diretamente na máquina:

- Node.js 22;
- npm;
- PostgreSQL, Redis e RabbitMQ acessíveis;
- banco migrado e role de runtime provisionada.

O projeto usa `npm` como gerenciador de pacotes de referência. O Dockerfile e os
ambientes de build utilizam `npm ci` e `package-lock.json`.

## Início rápido com Docker

Crie o arquivo de ambiente a partir do exemplo:

```bash
# Linux e macOS
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Troque os segredos e senhas de exemplo antes de iniciar o ambiente. Em seguida:

```bash
docker compose up --build
```

O Compose executa o fluxo abaixo automaticamente:

1. inicia o PostgreSQL;
2. executa as migrations com o usuário owner;
3. cria ou atualiza a role restrita usada pela aplicação;
4. inicia Redis e RabbitMQ;
5. inicia a API com a role de runtime.

Serviços disponíveis no ambiente local:

| Serviço | Endereço |
| --- | --- |
| API | `http://localhost:${PORT}` — `3333` no `.env.example` |
| RabbitMQ | `amqp://localhost:5672` |
| RabbitMQ Management | `http://localhost:15672` (`dev` / `dev`) |
| Redis | `localhost:6379` |
| PostgreSQL | `127.0.0.1:${POSTGRES_PORT}` |

As credenciais `dev` e os valores padrão do Compose são exclusivos para o
ambiente local. Não os reutilize em produção.

Para encerrar os containers sem apagar os volumes:

```bash
docker compose down
```

## Desenvolvimento local

Instale as dependências:

```bash
npm ci
```

Copie e ajuste o `.env` conforme mostrado na seção anterior. Quando Redis e
RabbitMQ estiverem executando na máquina local, inclua também:

```dotenv
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URI=amqp://dev:dev@localhost:5672
RABBITMQ_EXCHANGE=domain-events
```

O modo de desenvolvimento pressupõe que o banco já foi migrado e que a role
definida por `POSTGRES_APP_USER` foi provisionada. Para o primeiro setup, o
fluxo completo com Docker é o caminho recomendado.

Inicie a API com recarregamento automático:

```bash
npm run start:dev
```

Outros modos de execução:

```bash
# Execução sem watch
npm run start

# Debug com watch
npm run start:debug

# Build e execução da saída compilada
npm run build
npm run start:prod
```

## Configuração

O NestJS carrega o arquivo `.env` na inicialização. Use `.env.example` como
ponto de partida e nunca versione credenciais reais.

### Aplicação e frontend

| Variável | Finalidade | Exemplo/padrão local |
| --- | --- | --- |
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta HTTP da API | `3333` |
| `FRONTEND_URL` | Origem permitida por CORS e Socket.IO | `http://localhost:5173` |
| `TRUST_PROXY` | Confia em um proxy reverso à frente da API | `false` |
| `COOKIE_DOMAIN` | Domínio compartilhado dos cookies em produção | vazio em desenvolvimento |

Ative `TRUST_PROXY=true` somente quando houver exatamente um proxy reverso
confiável antes da aplicação.

### PostgreSQL

| Variável | Finalidade |
| --- | --- |
| `POSTGRES_HOST` | Host do PostgreSQL |
| `POSTGRES_PORT` | Porta do PostgreSQL |
| `POSTGRES_DB` | Nome do banco |
| `POSTGRES_USER` | Owner usado pelas migrations |
| `POSTGRES_PASSWORD` | Senha do owner |
| `POSTGRES_APP_USER` | Role restrita usada em runtime |
| `POSTGRES_APP_PASSWORD` | Senha da role de runtime |

`POSTGRES_USER` e `POSTGRES_APP_USER` devem ser usuários diferentes. A role de
runtime é criada sem privilégios administrativos e sem permissão para ignorar
RLS.

### Autenticação

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | Assinatura do access token | obrigatório, mínimo de 32 caracteres |
| `JWT_REFRESH_SECRET` | Assinatura do refresh token | obrigatório, mínimo de 32 caracteres |
| `JWT_ACCESS_EXPIRES_IN` | Validade do access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Validade do refresh token | `30d` |

As durações aceitam um número positivo seguido de `s`, `m`, `h` ou `d`.

### Infraestrutura e integrações

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `RABBITMQ_URI` | URI de conexão AMQP | obrigatório para mensageria |
| `RABBITMQ_EXCHANGE` | Exchange de eventos de domínio | `domain-events` |
| `GOOGLE_API_KEY` | Chave usada na extração de PDF por IA | necessária para `extracaoPorIA` |
| `GOOGLE_MODEL` | Modelo Google GenAI | `gemini-pro` |
| `GOOGLE_TEMPERATURE` | Temperatura do modelo | `0.7` |

### E-mail e bootstrap

| Variável | Finalidade |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT` | Servidor SMTP |
| `SMTP_USER`, `SMTP_PASSWORD` | Credenciais SMTP |
| `SMTP_FROM` | Remetente dos e-mails |
| `BOOTSTRAP_TENANT_SLUG` | Slug do tenant inicial |
| `BOOTSTRAP_ADMIN_NAME` | Nome do primeiro administrador |
| `BOOTSTRAP_ADMIN_EMAIL` | E-mail do primeiro administrador |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha do primeiro administrador, mínimo de 12 caracteres |

Sem credenciais SMTP, o envio de e-mail fica desabilitado. O Mailtrap pode ser
usado como sandbox no desenvolvimento.

## Banco de dados e migrations

As migrations administrativas usam `POSTGRES_USER`. A aplicação usa
`POSTGRES_APP_USER`, que possui somente os privilégios necessários para o
runtime e permanece sujeita às políticas de RLS.

| Comando | Descrição |
| --- | --- |
| `npm run migration:run` | Executa as migrations pendentes |
| `npm run migration:revert` | Reverte a migration mais recente |
| `npm run migration:generate -- caminho/DaMigration` | Gera uma migration com base nas entidades |
| `npm run migration:create -- caminho/DaMigration` | Cria uma migration vazia |
| `npm run migration:money:run` | Executa a migration controlada de valores monetários |

No ambiente Docker, migrations e provisionamento da role de runtime já fazem
parte da inicialização do Compose.

### Primeiro administrador

Preencha as variáveis `BOOTSTRAP_*` e execute:

```bash
npm run bootstrap:admin
```

O tenant indicado por `BOOTSTRAP_TENANT_SLUG` precisa existir. O comando cria ou
atualiza, nesse tenant, o usuário informado e garante o papel `SUPER_ADMIN`.

## Autenticação, autorização e tenants

A autenticação utiliza dois cookies HTTP-only:

- `finance_access`: access token de curta duração;
- `finance_refresh`: refresh token rotacionado.

Em produção, os cookies são marcados como `secure`. CORS e Socket.IO aceitam a
origem configurada em `FRONTEND_URL` com credenciais habilitadas.

A aplicação registra globalmente:

- rate limiting;
- validação JWT;
- autorização por papel (`SUPER_ADMIN`, `ADMIN` e `MEMBER`);
- interceptor responsável por criar o contexto transacional do tenant.

Mais detalhes estão em
[`docs/auth-multitenancy.md`](docs/auth-multitenancy.md).

## Principais grupos de endpoints

A API não utiliza prefixo global. Os principais grupos são:

| Prefixo | Responsabilidade |
| --- | --- |
| `/auth` | Login, refresh, logout, sessão e recuperação de senha |
| `/tenants` | Administração de tenants |
| `/members`, `/invites` | Membros e convites |
| `/users` | Usuários |
| `/despesas` | Despesas, consolidações e dados importados |
| `/receitas` | Receitas e consolidações |
| `/categorias` | Categorias |
| `/parcelas` | Parcelas |
| `/pagamentos` | Formas e estados de pagamento |
| `/status` | Status financeiros |
| `/files/despesas` | Upload e extração de PDFs |
| `/redis/ping` | Diagnóstico de conectividade com Redis |

Os endpoints são protegidos por padrão. Apenas rotas marcadas explicitamente
como públicas, como login, refresh e recuperação de senha, dispensam access
token.

## Importação de PDFs

O endpoint `POST /files/despesas` aceita PDFs de até 5 MB e valida a assinatura
real do arquivo, não apenas sua extensão ou MIME type.

O parâmetro de query `tipo` seleciona o processamento:

- `extracaoFaturaCartao`: extração local e determinística;
- `extracaoPorIA`: envia o PDF ao Google GenAI e exige `GOOGLE_API_KEY`.

O resultado temporário é armazenado no Redis por 24 horas. O arquivo enviado é
removido após o processamento.

## Testes e qualidade

| Comando | Descrição |
| --- | --- |
| `npm run test` | Testes unitários |
| `npm run test:watch` | Testes unitários em watch mode |
| `npm run test:integration` | Testes de integração, executados em série |
| `npm run test:e2e` | Testes end-to-end |
| `npm run test:cov` | Cobertura de testes |
| `npm run lint` | ESLint com correções automáticas |
| `npm run format` | Formatação com Prettier |

Os testes de integração carregam as variáveis do arquivo `.env` e podem exigir
serviços de infraestrutura disponíveis.

## Documentação complementar

- [Índice da documentação](docs/README.md)
- [Valores monetários](docs/money.md)
- [Autenticação, tenants e isolamento](docs/auth-multitenancy.md)
- [Extração de créditos de extrato como receitas](docs/extracao-extrato-receitas.md)
- [Amazon MQ com Floci](docs/amazon-mq-floci.md)
- [Oportunidades com LangChain](docs/langchain-opportunities.md) — proposta em
  evolução, não funcionalidade implementada.

## Solução de problemas

### A aplicação rejeita os segredos JWT

`JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` precisam conter pelo menos 32
caracteres fora do ambiente de testes.

### A aplicação não conecta ao RabbitMQ

Confirme se `RABBITMQ_URI` está definido e se o broker está saudável. No Docker,
use `docker compose ps` para verificar os serviços.

### A aplicação não acessa tabelas do PostgreSQL

Confirme se as migrations terminaram e se a etapa `postgres-role-init` foi
concluída. O owner de migrations e a role de runtime não podem ser o mesmo
usuário.

### `npm run start:prod` não encontra `dist/main`

Execute `npm run build` antes de iniciar o modo de produção.

## Licença

Projeto privado e não licenciado para distribuição (`UNLICENSED`).
