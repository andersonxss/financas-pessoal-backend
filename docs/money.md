# Valores monet?rios de despesas e receitas

O contrato JSON usa n?meros em reais: 0.01 representa um centavo. O formul?rio envia texto decimal com ponto, sem s?mbolo ou separadores de milhar. Apenas a apresenta??o usa pt-BR.

Os quatro DTOs exigem n?mero finito com at? duas casas e magnitude m?xima 99999999.99. Zero e negativos continuam aceitos; esta altera??o n?o define novas regras de neg?cio sobre o sinal.

As entidades usam decimal(10,2), serializando texto decimal para o banco e retornando n?meros para manter o contrato atual. N?o efetue somas/divis?es monet?rias com ponto flutuante: use centavos inteiros ou aritm?tica decimal. O parcelamento existente repete o valor por parcela; n?o foi alterado para dividir um total.

## Banco existente

A migration NormalizeMoneyColumns1793923200000 n?o est? na lista autom?tica do bootstrap. Para aplic?-la, com backup e conex?o POSTGRES_* apontando para o banco desejado, execute no diret?rio server-nestjs:

    npm run migration:money:run

O comando carrega .env sem imprimir credenciais. No host, use a porta publicada do PostgreSQL; dentro da rede Docker, use postgres:5432. A execu??o usa uma transa??o e bloqueia escrita nas duas tabelas. Se houver valores fora do limite ou com mais de duas casas, aborta antes de alterar colunas. Revise esses registros explicitamente.

Nenhum dado foi corrigido retroativamente: um valor j? salvo como 1 n?o pode ser identificado automaticamente como um antigo 0.01. A migration preserva valores compat?veis e n?o tenta inferir essa inten??o.
