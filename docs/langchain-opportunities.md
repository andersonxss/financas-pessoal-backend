# Oportunidades de evolução com LangChain

> **Status:** especificação em evolução. Este documento registra possibilidades
> de produto e direcionamento técnico; não comprova comportamento atualmente
> implementado.

## Objetivo

Evoluir a integração atual com modelos generativos para uma camada de
orquestração capaz de consultar dados financeiros, extrair documentos, explicar
resultados e preparar operações com segurança. O LangChain não substituiria o
Gemini nem as regras de negócio existentes: ele coordenaria modelos, ferramentas,
validação, memória, recuperação de documentos e fluxos de aprovação.

O primeiro resultado esperado é tornar a importação de faturas mais confiável.
Depois, a mesma infraestrutura pode sustentar um copiloto financeiro somente
leitura e, por último, operações que exigem confirmação humana.

## Contexto atual

O backend já possui os principais pontos de extensão para essa evolução:

- uma porta de domínio `AIService`, atualmente limitada a `generateText`;
- uma implementação baseada em `@google/genai`;
- extração normal e extração por IA de faturas em PDF;
- Redis para resultados temporários de importação;
- CQRS para comandos e consultas financeiras;
- Socket.IO para comunicação em tempo real;
- isolamento multitenant em PostgreSQL, Redis, RabbitMQ e Socket.IO.

Essa base permite introduzir LangChain como adaptador de infraestrutura sem
acoplar entidades e regras de domínio ao framework de IA.

## Princípios de adoção

1. **IA não é fonte de verdade financeira.** Valores, totais, vencimentos,
   saldos e regras de parcelas continuam sendo calculados e validados por código
   determinístico.
2. **Ferramentas explícitas em vez de acesso livre ao banco.** O agente deve
   chamar consultas e comandos tipados, preferencialmente por `QueryBus` e
   `CommandBus`. Não deve receber uma ferramenta genérica de SQL.
3. **Leitura antes de escrita.** O primeiro copiloto deve operar somente em modo
   consulta. Toda operação mutável futura exige validação, idempotência, auditoria
   e, conforme o risco, aprovação humana.
4. **Contexto de segurança fora do modelo.** `tenantId`, `userId` e papéis devem
   vir exclusivamente da sessão autenticada. O modelo nunca pode escolher nem
   sobrescrever o escopo do tenant.
5. **Saídas estruturadas e validadas.** Respostas usadas pelo sistema devem
   respeitar schemas, limites e regras de negócio antes de chegar aos comandos.
6. **Evidências visíveis.** Respostas sobre documentos devem informar suas
   fontes; análises financeiras devem informar período, filtros e dados usados.
7. **Falha segura.** Baixa confiança, saída inválida ou indisponibilidade do
   modelo deve produzir revisão manual ou degradação controlada, nunca uma
   gravação silenciosa.

## Funcionalidades propostas

### 1. Importação inteligente de faturas

Este é o caso de uso prioritário porque já existe um fluxo de upload e extração
por IA.

Possibilidades:

- retornar lançamentos com schema estruturado e validado;
- normalizar descrição, valor, vencimento e informações de parcela;
- rejeitar ou tentar corrigir automaticamente respostas fora do contrato;
- atribuir nível de confiança por documento e por lançamento;
- destacar campos incertos para revisão;
- comparar a extração tradicional com a extração por IA;
- detectar linhas duplicadas, totais de fatura e textos institucionais;
- preservar a origem de cada lançamento para auditoria;
- permitir aprovação em lote antes da publicação dos eventos de despesa;
- registrar versão do prompt, modelo e schema utilizados.

O modelo deve produzir uma proposta de importação. A criação efetiva das
despesas continua passando pelos validadores, comandos e eventos existentes.

#### Critérios iniciais de aceite

- nenhuma resposta textual é consumida como lançamento sem validação de schema;
- valores inválidos, datas inválidas e identificadores desconhecidos são
  rejeitados;
- nenhuma despesa é persistida antes da confirmação do usuário;
- uma falha parcial identifica exatamente os itens afetados;
- arquivos temporários e resultados de Redis respeitam o tenant autenticado;
- testes cobrem documento válido, documento vazio, JSON inválido, duplicidade e
  baixa confiança.

### 2. Categorização automática

O sistema pode sugerir categorias a partir da descrição do estabelecimento, do
histórico confirmado e de regras configuradas pelo tenant.

Uma estratégia em camadas reduz custo e aumenta previsibilidade:

1. regra exata configurada pelo usuário;
2. correspondência com descrições anteriormente confirmadas;
3. similaridade semântica com o histórico do tenant;
4. classificação pelo modelo apenas quando as etapas anteriores forem
   inconclusivas;
5. confirmação do usuário para sugestões abaixo do limite de confiança.

Correções feitas pelo usuário devem alimentar regras ou exemplos futuros, sem
usar dados de um tenant para categorizar dados de outro.

### 3. Copiloto financeiro somente leitura

Um assistente conversacional pode responder perguntas sobre os dados do usuário:

- quanto foi gasto por categoria em determinado período;
- comparação entre receitas e despesas;
- contas abertas ou próximas do vencimento;
- evolução mensal de uma categoria;
- maiores despesas do período;
- diferenças entre meses ou anos;
- composição do saldo e explicação de variações.

Cada capacidade deve ser exposta como ferramenta pequena e tipada, por exemplo:

- `listarDespesasDoPeriodo`;
- `somarDespesasPorCategoria`;
- `listarReceitasDoPeriodo`;
- `consultarContasEmAberto`;
- `obterSerieMensal`.

As ferramentas devem receber o contexto autenticado por injeção do backend. O
modelo pode escolher filtros de negócio permitidos, mas não pode fornecer ou
alterar `tenantId`.

#### Requisitos de resposta

- informar período e filtros considerados;
- distinguir valor calculado de interpretação textual;
- evitar afirmar causalidade quando os dados mostram apenas correlação;
- indicar quando faltam dados para responder;
- permitir que o usuário consulte os lançamentos que sustentam o resumo.

### 4. Detecção de anomalias e inconsistências

O sistema pode identificar eventos que merecem revisão:

- cobrança possivelmente duplicada;
- valor muito acima do histórico do estabelecimento ou categoria;
- aumento de assinatura recorrente;
- parcela faltante, repetida ou inconsistente;
- receita recorrente esperada que não entrou;
- despesa aberta após o vencimento;
- lançamento com categoria improvável;
- divergência entre total da fatura e soma dos itens extraídos.

A detecção deve combinar regras e estatística determinística. O modelo entra na
explicação, no agrupamento e na priorização dos alertas. Ele não decide sozinho
que um lançamento é fraude nem altera dados automaticamente.

### 5. Análise e previsão de fluxo de caixa

Com base em saldos, recorrências, parcelas, receitas e vencimentos, o sistema
pode oferecer:

- projeção de saldo para 30, 60 e 90 dias;
- estimativa de compromissos já conhecidos;
- cenários de redução ou aumento de categorias;
- resumo mensal em linguagem natural;
- identificação de meses potencialmente deficitários;
- explicação dos fatores que mais afetam a projeção.

O motor de projeção deve ser independente do LLM e retornar dados estruturados.
O LangChain coordena a consulta e transforma os resultados em explicações. Toda
previsão deve declarar premissas, horizonte e grau de incerteza.

### 6. RAG sobre documentos financeiros

Retrieval-Augmented Generation pode permitir buscas sobre faturas, comprovantes,
contratos, notas e outros documentos autorizados:

- localizar a fatura de uma compra;
- encontrar documentos relacionados a um fornecedor;
- resumir obrigações financeiras de um contrato;
- comparar cláusulas ou valores entre documentos;
- responder com citações para páginas ou trechos de origem.

O fluxo esperado inclui ingestão, extração de texto, divisão em trechos,
embeddings, armazenamento vetorial, recuperação e geração da resposta.

Requisitos obrigatórios:

- índice, coleção ou namespace isolado por tenant;
- metadados de autorização em todos os documentos e trechos;
- exclusão sincronizada entre o arquivo de origem e o índice vetorial;
- proteção contra instruções maliciosas contidas nos documentos;
- citação da fonte e recusa quando não houver evidência suficiente;
- política de retenção e tratamento de dados pessoais definida antes da
  produção.

Referência: [RAG no LangChain para JavaScript](https://docs.langchain.com/oss/javascript/deepagents/rag).

### 7. Ações financeiras assistidas

Em uma fase posterior, o agente pode preparar operações como:

- criar despesa ou receita;
- atualizar categoria;
- marcar lançamento como pago;
- gerar ou ajustar parcelas;
- preparar lembrete ou notificação;
- corrigir um conjunto de itens importados.

O agente deve primeiro apresentar um resumo estruturado da ação. A execução só
ocorre depois de confirmação explícita e passa pelos mesmos DTOs, comandos,
autorizações e regras utilizados pelas APIs convencionais.

Operações em lote ou destrutivas precisam de confirmação reforçada. A execução
deve ser idempotente e registrar solicitante, aprovador, ferramenta chamada,
argumentos validados e resultado.

LangGraph oferece interrupções e retomada para fluxos com aprovação humana:
[human-in-the-loop](https://docs.langchain.com/oss/javascript/langgraph/interrupts).

### 8. Chat financeiro em tempo real

O gateway Socket.IO existente pode evoluir para transmitir:

- tokens ou blocos da resposta conforme ficam disponíveis;
- ferramentas em execução;
- progresso de análises longas;
- pedidos de confirmação;
- conclusão, falha e possibilidade de nova tentativa.

A memória de conversa deve ter identificador próprio, escopo por usuário e
tenant, prazo de retenção e limite de tamanho. Salas Socket.IO continuam sendo
derivadas da sessão autenticada; nomes de sala enviados pelo cliente não podem
ampliar o acesso.

### 9. Relatórios e explicações automáticas

O sistema pode gerar comentários para dashboards e fechamentos:

- resumo do mês;
- principais variações de receitas e despesas;
- categorias que mais cresceram;
- despesas atípicas;
- alertas de vencimento;
- comparação com metas quando elas existirem.

Os números devem vir de consultas determinísticas. A resposta do modelo deve
receber esses resultados já calculados e ser impedida de recalcular ou inventar
valores.

### 10. Assistente operacional e de suporte

Com acesso apenas a documentação autorizada, um assistente pode explicar como
usar o sistema, importar faturas, interpretar status e resolver erros conhecidos.
Esse caso de uso deve usar RAG sobre documentação vigente e manter referências
históricas ou planos fora do índice de comportamento atual.

## Arquitetura proposta

### Limites de responsabilidade

O domínio não deve importar LangChain. Em vez de ampliar uma porta genérica de
texto indefinidamente, a aplicação pode definir contratos orientados a tarefas,
por exemplo:

- extrair lançamentos de um documento;
- classificar uma descrição;
- gerar explicação a partir de dados calculados;
- executar uma conversa com ferramentas autorizadas.

Os adaptadores de LangChain ficam em `infrastructure/ai`. Ferramentas de agente
ficam na fronteira de aplicação e delegam para `QueryBus` ou `CommandBus`. DTOs e
schemas validam a passagem entre resposta do modelo e caso de uso.

Fluxo recomendado para consultas:

```text
Cliente autenticado
  -> Controller ou Socket.IO
  -> Caso de uso do copiloto
  -> Agente LangChain
  -> Ferramenta tipada
  -> QueryBus
  -> Repositório com contexto transacional do tenant
  -> Resultado estruturado
  -> Explicação do modelo
```

Fluxo recomendado para mutações:

```text
Pedido em linguagem natural
  -> Proposta estruturada
  -> Validação de schema e regra
  -> Confirmação humana
  -> CommandBus
  -> Evento e persistência existentes
  -> Registro de auditoria
```

### Memória e persistência de execução

Conversas curtas podem usar estado temporário. Fluxos longos, aprovações ou
processamentos recuperáveis precisam de checkpoints persistentes. A escolha do
armazenamento deve considerar retenção, exclusão, criptografia e isolamento por
tenant.

LangGraph suporta diferentes níveis de durabilidade. O modo escolhido deve ser
explícito por fluxo: operações financeiras importantes favorecem maior
durabilidade; respostas informativas podem priorizar latência.

Referência: [checkpoints e durabilidade](https://docs.langchain.com/oss/javascript/langgraph/checkpointers).

### Observabilidade

Cada execução deve permitir correlacionar:

- requisição e usuário autenticado;
- tenant, armazenado de forma segura e não exposto em prompts desnecessários;
- modelo, versão do prompt e ferramentas disponíveis;
- ferramentas chamadas e respectivas durações;
- consumo estimado de tokens e custo;
- falhas de validação, novas tentativas e fallback;
- aprovação ou rejeição humana;
- resultado final.

Prompts, documentos e respostas podem conter dados pessoais ou financeiros. Logs
e plataformas externas de observabilidade devem aplicar redação e política de
retenção antes de receber esse conteúdo.

## Segurança e multitenancy

O contrato atual de isolamento continua obrigatório em todos os fluxos de IA:

- RLS com `FORCE ROW LEVEL SECURITY` permanece como defesa principal no banco;
- repositórios continuam filtrando explicitamente por tenant;
- chaves de Redis recebem prefixo `tenant:{tenantId}:`;
- mensagens RabbitMQ carregam contexto criado pelo backend;
- salas Socket.IO são derivadas do token autenticado;
- índices vetoriais separam tenants e aplicam filtro de metadados;
- caches de prompts, respostas e embeddings não podem ser compartilhados quando
  contiverem dados do cliente;
- ferramentas respeitam papéis e permissões, mesmo quando chamadas pelo agente;
- conteúdo de usuário e de documentos é tratado como dado, nunca como instrução
  confiável para substituir políticas do sistema.

Guardrails recomendados:

- redação de PII antes de enviar conteúdo quando a tarefa permitir;
- limite de tamanho e tipo de arquivo;
- lista permitida de ferramentas por caso de uso e papel;
- limite de iterações e tempo do agente;
- limite de tokens e custo por tenant;
- validação de entrada e saída;
- aprovação humana para ferramentas sensíveis;
- proteção contra prompt injection em documentos recuperados;
- rate limiting específico para endpoints de IA.

Referência: [guardrails no LangChain para JavaScript](https://docs.langchain.com/oss/javascript/langchain/guardrails).

## Qualidade, testes e avaliações

Testes tradicionais continuam necessários, mas fluxos com modelos também
precisam de avaliações baseadas em conjuntos de exemplos.

### Testes deterministas

- schemas de entrada e saída;
- autorização e isolamento entre tenants;
- ferramentas e integração com CQRS;
- idempotência de comandos;
- cálculos financeiros;
- fallback, timeout e indisponibilidade do provedor;
- remoção de documento e de seus embeddings;
- aprovação, rejeição e retomada de fluxos.

### Avaliações de IA

- precisão da extração por campo;
- taxa de documentos que exigem revisão;
- falsos positivos de duplicidade e anomalia;
- acerto de categoria antes e depois da confirmação;
- fidelidade das respostas aos resultados das ferramentas;
- presença de fontes em respostas RAG;
- resistência a prompt injection;
- estabilidade ao trocar modelo ou prompt;
- custo e latência por caso de uso.

Prompts e modelos devem ser promovidos com um conjunto versionado de faturas e
perguntas anonimizadas. Uma melhoria de fluidez não compensa regressão de
precisão, segurança ou custo.

## Roadmap sugerido

### Fase 0 — Fundação

- definir schemas de lançamento e erros de extração;
- definir métricas e conjunto de avaliação anonimizado;
- criar política de logs, retenção e custos;
- separar contratos de tarefa da porta genérica `generateText`;
- instrumentar modelo, prompt, duração e falhas.

**Saída verificável:** extração atual medida por uma linha de base reproduzível.

### Fase 1 — Extração estruturada

- introduzir saída estruturada e validação;
- adicionar nova tentativa controlada e fallback;
- calcular confiança e sinalizar revisão;
- preservar origem dos itens;
- manter confirmação antes da importação.

**Saída verificável:** faturas do conjunto de avaliação produzem resultados
válidos, auditáveis e sem persistência automática.

### Fase 2 — Categorização e qualidade de importação

- implementar estratégia em camadas para categoria;
- detectar duplicidades e divergências de total;
- registrar correções do usuário;
- medir precisão por categoria e tenant sem misturar dados.

**Saída verificável:** sugestões demonstram ganho mensurável sobre a linha de
base e sempre podem ser corrigidas antes da gravação.

### Fase 3 — Copiloto somente leitura

- disponibilizar um conjunto pequeno de ferramentas CQRS;
- responder com filtros, período e dados de apoio;
- integrar streaming ao Socket.IO;
- adicionar limites de custo, iterações e tempo.

**Saída verificável:** perguntas aprovadas no conjunto de avaliação retornam os
mesmos valores das consultas determinísticas e não atravessam tenants.

### Fase 4 — Anomalias, relatórios e previsões

- criar detectores determinísticos;
- adicionar explicações e priorização;
- implementar projeção com premissas declaradas;
- publicar alertas sem alterar lançamentos.

**Saída verificável:** cada alerta aponta evidências e cada previsão informa
premissas, horizonte e dados utilizados.

### Fase 5 — RAG documental

- definir armazenamento vetorial e isolamento;
- implementar ingestão, exclusão e citação;
- avaliar recuperação e prompt injection;
- estabelecer política de retenção.

**Saída verificável:** respostas citam apenas documentos autorizados e a exclusão
remove tanto o original quanto seus vetores.

### Fase 6 — Ações com aprovação humana

- expor comandos permitidos como ferramentas tipadas;
- implementar proposta, confirmação e retomada;
- adicionar idempotência e auditoria;
- liberar gradualmente por operação e papel.

**Saída verificável:** nenhuma mutação ocorre sem autorização, validação e
confirmação exigidas pelo fluxo.

## Priorização resumida

| Prioridade | Iniciativa | Valor esperado | Risco inicial |
| --- | --- | --- | --- |
| 1 | Extração estruturada de faturas | Alto | Médio |
| 2 | Categorização e detecção de duplicidade | Alto | Médio |
| 3 | Copiloto somente leitura | Alto | Médio |
| 4 | Anomalias e relatórios explicados | Médio/alto | Médio |
| 5 | Previsão de fluxo de caixa | Médio/alto | Médio |
| 6 | RAG documental | Médio | Médio/alto |
| 7 | Ações financeiras assistidas | Alto | Alto |

## Custos e operação

Antes da implantação, cada fluxo deve ter:

- modelo padrão e modelo de fallback;
- limite de tokens, iterações e documentos;
- timeout e política de novas tentativas;
- custo estimado por operação;
- cota por tenant ou plano;
- estratégia de cache que não atravesse tenants;
- comportamento quando o provedor estiver indisponível;
- painel ou alertas para aumento anormal de custo e latência.

Modelos menores podem atender classificação e roteamento; tarefas complexas
podem usar um modelo mais capaz somente quando necessário. A seleção dinâmica
deve ser mensurada e previsível, não baseada apenas no tamanho da conversa.

## Fora de escopo inicial

- permitir que o agente execute SQL arbitrário;
- persistir lançamentos sem revisão do usuário;
- recomendar investimentos ou substituir aconselhamento financeiro profissional;
- declarar fraude com base apenas na opinião do modelo;
- treinar modelos com dados de clientes sem consentimento e política específica;
- compartilhar memória, embeddings ou exemplos entre tenants;
- substituir cálculos financeiros determinísticos por respostas do LLM;
- implantar todas as funcionalidades em uma única entrega.

## Decisões pendentes antes da implementação

- provedor e modelo inicial para cada tarefa;
- uso de LangChain apenas para orquestração ou adoção de LangGraph para fluxos
  duráveis desde a primeira fase;
- armazenamento de checkpoints e prazo de retenção das conversas;
- vector store e estratégia de isolamento para RAG;
- limites de custo e disponibilidade por tenant ou plano;
- limiar de confiança que exige revisão na importação;
- quais ações futuras exigem confirmação simples ou reforçada;
- política de auditoria e observabilidade para conteúdo financeiro sensível.

Essas decisões devem ser registradas antes que a respectiva fase deixe o estado
de exploração e passe a definir comportamento de produção.
