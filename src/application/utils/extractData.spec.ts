import { extractData } from './extractData';
import { categoriasEnum, statusEnum, tipoPagamentoEnum } from '../enums';

describe('extractData', () => {
  const vencimento = '2026-04-10';
  const tenantId = 'tenant-1';

  it('extrai lançamentos, continuações de linha, parcelas e valores em reais', () => {
    const text = `
      Data Histórico Moeda de origem
      14/03 Vibra Energia 30,00
      13/03 MAGALU FL 892 1/10 196,20
      11/03 O BARATAO AUTO PECAS
      1/2 55,04
      03/03 EC RWENUS 2/6 1.249,54
      13/02 AMAZON BR 1/6 -221,45
    `;

    expect(extractData(text, vencimento, tenantId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          descricao: 'Vibra Energia',
          valor: 30,
          parcela: null,
          prazoInicio: null,
          prazoFim: null,
          active: true,
          vencimento,
          tenant_id: tenantId,
          pagamento_id: tipoPagamentoEnum.cartao,
        }),
        expect.objectContaining({
          descricao: 'MAGALU FL 892',
          valor: 196.2,
          parcela: '1/10',
          prazoInicio: 1,
          prazoFim: 10,
          active: true,
        }),
        expect.objectContaining({
          descricao: 'O BARATAO AUTO PECAS',
          valor: 55.04,
          parcela: '1/2',
        }),
        expect.objectContaining({
          descricao: 'EC RWENUS',
          valor: 1249.54,
          parcela: '2/6',
          active: false,
        }),
        expect.objectContaining({
          descricao: 'AMAZON BR',
          valor: -221.45,
        }),
      ]),
    );
  });

  it('ignora saldo anterior e pagamento da fatura', () => {
    const text = `
      10/03 SALDO ANTERIOR 2.391,03
      10/03 PAG BOLETO BANCARIO -2.391,03
      04/03 AmazonPrimeBR 19,90
    `;

    const result = extractData(text, vencimento, tenantId);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        descricao: 'AmazonPrimeBR',
        valor: 19.9,
      }),
    );
  });

  it('retorna um array vazio quando não há lançamentos válidos', () => {
    expect(
      extractData('Total da Fatura em Real R$ 1.620,65', vencimento, tenantId),
    ).toEqual([]);
  });

  it('extrai débitos e todos os créditos de um extrato bancário Bradesco', () => {
    const text = `
      Bradesco Celular
      Extrato de: Agência: 3237 | Conta: 141830-0
      Data Histórico Docto. Crédito (R$) Débito (R$) Saldo (R$)
      01/10/2026 RENTAB.INVEST FACILCRED* 0000002 0,18 1.000,18
      PAGTO ELETRON COBRANCA
      GCI CAIXA - HABITACAO 0000064 10,00 990,18
      02/10/2026 RENTAB.INVEST FACILCRED* 9159940 0,02 990,20
      05/10/2026 RENTAB.INVEST FACILCRED* 9159941 0,03 990,23
      06/10/2026 RENTAB.INVEST FACILCRED* 9159942 0,01 990,24
      07/10/2026 RENTAB.INVEST FACILCRED* 9159943 0,01 990,25
      19/10/2026 TED-TRANSF ELET DISPON
      REMET.CAIXA ECONOMICA FEDE 3777393 2.519,00 3.509,25
      21/10/2026 RENTAB.INVEST FACILCRED* 7490153 0,01 3.509,26
      26/10/2026 RENTAB.INVEST FACILCRED* 7490154 0,01 3.509,27
      29/10/2026 RENTAB.INVEST FACILCRED* 7490155 0,01 3.509,28
      Total 2.519,28 10,00 3.509,28
    `;

    const result = extractData(text, vencimento, tenantId);
    const despesas = result.filter((item) => item.tipo === 'despesa');
    const receitas = result.filter((item) => item.tipo === 'receita');

    expect(despesas).toHaveLength(1);
    expect(despesas[0]).toEqual(
      expect.objectContaining({
        descricao: 'PAGTO ELETRON COBRANCA GCI CAIXA - HABITACAO',
        valor: 10,
        vencimento: '2026-10-01',
        tenant_id: tenantId,
        pagamento_id: tipoPagamentoEnum.pix,
      }),
    );
    expect(receitas).toHaveLength(9);
    expect(receitas.map((item) => item.valor)).toEqual([
      0.18, 0.02, 0.03, 0.01, 0.01, 2519, 0.01, 0.01, 0.01,
    ]);
    expect(receitas.reduce((total, item) => total + item.valor, 0)).toBeCloseTo(
      2519.28,
    );
    expect(receitas[5]).toEqual(
      expect.objectContaining({
        descricao: 'TED-TRANSF ELET DISPON REMET.CAIXA ECONOMICA FEDE',
        recebimento: '2026-10-19',
        categoria_id: categoriasEnum.outros,
        status_id: statusEnum.pago,
      }),
    );
  });

  it('extrai a transferência de saldo salarial quando ela é o primeiro lançamento', () => {
    const text = `
      Bradesco Celular
      Extrato de: Agência: 3237 | Conta: 141830-0
      Data Histórico Docto. Crédito (R$) Débito (R$) Saldo (R$)
      05/01/2026 TRANSF SALDO C/SAL P/CC
      BCO:237 AGE:03390 CTA:0288142-P 0503390 3.441,00 3.441,00
      PIX ENVIADO
      DES: TITULAR DA CONTA 03/01 1824394 3.441,00 0,00
      20/01/2026 TRANSF SALDO C/SAL P/CC
      BCO:237 AGE:03390 CTA:0288142-P 2003390 2.754,00 2.754,00
      PIX ENVIADO
      DES: TITULAR DA CONTA 20/01 0545415 2.754,00 0,00
      Total 6.195,00 6.195,00 0,00
    `;

    const result = extractData(text, vencimento, tenantId);
    const receitas = result.filter((item) => item.tipo === 'receita');
    const despesas = result.filter((item) => item.tipo === 'despesa');

    expect(result).toHaveLength(4);
    expect(receitas.map((item) => item.valor)).toEqual([3441, 2754]);
    expect(despesas.map((item) => item.valor)).toEqual([3441, 2754]);
    expect(receitas[0]).toEqual(
      expect.objectContaining({
        descricao: 'TRANSF SALDO C/SAL P/CC BCO:237 AGE:03390 CTA:0288142-P',
        recebimento: '2026-01-05',
      }),
    );
  });
});
