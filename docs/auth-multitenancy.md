# Autenticação, tenants e isolamento

## Contrato atual

O backend NestJS usa access token curto de 15 minutos e refresh token rotacionado com validade deslizante de 30 dias. Ambos são enviados em cookies `HttpOnly` e `SameSite=Strict`; o access token também é retornado no login e refresh para clientes de API que usam `Authorization: Bearer`. Cada refresh bem-sucedido renova o prazo de 30 dias e substitui o refresh token anterior.

O refresh valida novamente o estado do usuário e do tenant. Um tenant desativado não pode renovar a sessão; access tokens já emitidos expiram no prazo curto configurado.

Papéis disponíveis:

- `SUPER_ADMIN`: administra tenants e possui acesso operacional global previsto pelas políticas RLS.
- `ADMIN`: administra membros e convites do próprio tenant.
- `MEMBER`: usa os recursos financeiros do próprio tenant.

Todas as rotas são autenticadas por padrão. Somente login, refresh, recuperação, redefinição e aceite de convite usam `@Public()`.

O backend limita requisições por IP globalmente e aplica limites mais restritos a login, refresh, recuperação, redefinição de senha e aceite de convite. Configure `TRUST_PROXY=true` somente quando a API estiver atrás de exatamente um proxy reverso confiável, para que o endereço do cliente seja interpretado corretamente.

## Endpoints

| Método            | Caminho                | Acesso                 | Resultado principal                    |
| ----------------- | ---------------------- | ---------------------- | -------------------------------------- |
| `POST`            | `/auth/login`          | Público                | Sessão e usuário atual                 |
| `POST`            | `/auth/refresh`        | Cookie de refresh      | Sessão rotacionada                     |
| `POST`            | `/auth/logout`         | Autenticado            | `204` e revogação do refresh           |
| `GET`             | `/auth/me`             | Autenticado            | Identidade, tenant e papel             |
| `POST`            | `/auth/recovery`       | Público                | `202`, sem revelar existência da conta |
| `POST`            | `/auth/reset-password` | Token de uso único     | `204`                                  |
| `GET/POST/PATCH`  | `/tenants`             | `SUPER_ADMIN`          | Administração paginada de tenants      |
| `GET`             | `/members`             | `ADMIN`, `SUPER_ADMIN` | Membros do tenant atual                |
| `GET/POST/DELETE` | `/invites`             | `ADMIN`, `SUPER_ADMIN` | Convites do tenant atual               |
| `POST`            | `/invites/accept`      | Público                | Criação da conta convidada             |

Listagens administrativas usam `page` e `limit`, com máximo de 100 itens.

A redefinição de senha exige entre 6 e 128 caracteres, incluindo letra
maiúscula, letra minúscula, número e caractere especial. O token expira em 30
minutos e pode ser usado uma única vez.

## Isolamento

As tabelas `users`, `status`, `categorias`, `parcelas`, `pagamentos`, `gastos`, `receitas`, `tenant_invites` e `auth_tokens` possuem `tenant_id`, índices e PostgreSQL Row-Level Security com `FORCE ROW LEVEL SECURITY`.

O `TenantInterceptor` abre uma transação por requisição autenticada e define `app.tenant_id` e `app.user_role` por `set_config(..., true)`. Os repositórios usam o mesmo `EntityManager` transacional e ainda incluem `tenantId` explicitamente em leituras, alterações e exclusões. Chaves estrangeiras compostas impedem relacionar registros de tenants diferentes.

Redis usa chaves com prefixo `tenant:{tenantId}:`, e Socket.IO autentica o cookie de access token antes de colocar o cliente em salas do tenant. Os relatórios da Home usam cache-aside com TTL de 60 segundos; alterações bem-sucedidas em despesas invalidam `home:despesas:*`, e alterações em receitas invalidam `home:receitas:*`, sempre dentro do prefixo do tenant atual.

Mensagens financeiras enviadas ao RabbitMQ carregam um envelope de contexto criado pelo backend a partir da sessão autenticada. O consumidor reabre uma transação com esse contexto antes de executar comandos sujeitos a RLS e somente confirma a mensagem depois da conclusão. Campos de tenant enviados dentro dos itens do cliente não são usados para definir o escopo da operação.

## Migration e dados existentes

A migration `EnterpriseAuthMultiTenancy1793923300000` cria o tenant `principal`, associa a ele os registros existentes e atribui `ADMIN` aos usuários migrados. O primeiro `SUPER_ADMIN` é promovido somente pelo comando explícito de bootstrap.

Execute:

```bash
npm run migration:run
```

No ambiente Docker, `docker compose up --build` executa a migration com o papel
proprietário e, antes de iniciar a API, provisiona `POSTGRES_APP_USER` como
`NOSUPERUSER` e `NOBYPASSRLS`. A API nunca deve usar o mesmo papel administrativo
empregado pelas migrations.

Para comprovar o isolamento no PostgreSQL ativo:

```bash
npm run test:integration
```

Esse teste verifica as flags do papel de runtime, `ENABLE/FORCE ROW LEVEL SECURITY`
nas nove tabelas protegidas e o bloqueio de leitura e alteração entre dois tenants.

`POSTGRES_DB` precisa apontar para um banco PostgreSQL já criado e com o schema financeiro existente. A migration de multitenancy associa os registros atuais ao tenant `principal`; ela não cria o banco nem substitui as migrations históricas das tabelas financeiras.

Em uma instalação sem usuários, preencha as variáveis `BOOTSTRAP_*` do `.env` e execute uma única vez:

```bash
npm run bootstrap:admin
```

O comando cria ou atualiza explicitamente o superadministrador do tenant escolhido e nunca usa senha padrão.

## Mailtrap Email Sandbox

Copie `server-nestjs/.env.example` para `.env` e informe as credenciais SMTP exibidas na integração Nodemailer do sandbox:

```dotenv
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=Finance Sistem <no-reply@finance.local>
```

O sandbox captura as mensagens e não as entrega a destinatários reais. Em produção, substitua as variáveis pelo SMTP transacional aprovado.

## Implantação

- Gere segredos independentes com pelo menos 32 caracteres para `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`.
- Configure `FRONTEND_URL` com uma origem exata; CORS aceita credenciais apenas dessa origem. Se frontend e API estiverem em subdomínios diferentes do mesmo site, configure também `COOKIE_DOMAIN=.exemplo.com`.
- Cookies `SameSite=Strict` pressupõem frontend e API no mesmo site. Se a implantação separar sites, use um proxy/BFF no domínio do frontend em vez de relaxar a política sem revisão de CSRF.
- Não use uma conexão PostgreSQL com privilégio `SUPERUSER` ou `BYPASSRLS` para a aplicação. Reserve `POSTGRES_USER` para migrations e configure a API com `POSTGRES_APP_USER`.
