import {
  categoriasEnum,
  parcelasEnum,
  statusEnum,
  tipoPagamentoEnum,
} from '../enums';

export interface ExtractedDespesa {
  valor: number;
  vencimento: string;
  parcela: string | null;
  prazoInicio: number | null;
  prazoFim: number | null;
  descricao: string;
  tipo: 'despesa';
  active: boolean;
  categoria_id: string;
  parcela_id: string;
  pagamento_id: string;
  status_id: string;
  tenant_id: string;
}

export interface ExtractedReceita {
  valor: number;
  recebimento: string;
  descricao: string;
  tipo: 'receita';
  categoria_id: string;
  status_id: string;
}

export type ExtractedFinancialEntry = ExtractedDespesa | ExtractedReceita;

const CARD_TRANSACTION_START = /^\s*\d{2}\/\d{2}\b/;
const CARD_TRANSACTION_PATTERN =
  /^(\d{2}\/\d{2})\s+(.+?)\s+(-?\d[\d.]*,\d{2})\s*$/;
const INSTALLMENT_PATTERN = /\b(\d{1,2})\/(\d{1,2})\b/;
const BANK_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})\b/;
const BRAZILIAN_MONEY_SOURCE = String.raw`-?\d{1,3}(?:\.\d{3})*,\d{2}`;
const BANK_RECORD_END_PATTERN = new RegExp(
  String.raw`\s(\d{7,12})\s+(${BRAZILIAN_MONEY_SOURCE})\s+(${BRAZILIAN_MONEY_SOURCE})\s*$`,
);

const IGNORED_DESCRIPTIONS = [
  'PAG BOLETO BANCARIO',
  'SALDO ANTERIOR',
  'TOTAL PARA',
  'TOTAL DA FATURA',
];

const BANK_CREDIT_DESCRIPTION_PATTERN =
  /\b(RENTAB\.INVEST|PIX RECEBIDO|TRANSF(?:ERENCIA)? RECEBIDA|DEPOSITO|SALARIO|CREDITO)\b|TED-TRANSF ELET DISPON|TRANSF SALDO C\/SAL P\/CC/;
const BANK_DEBIT_DESCRIPTION_PATTERN =
  /\b(PAGTO|PAGAMENTO|PIX ENVIADO|PIX QR CODE|COMPRA|SAQUE|TARIFA|DEBITO|BOLETO)\b/;

const normalizeSpaces = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const normalizeForComparison = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const parseBrazilianMoneyInCents = (value: string): number =>
  Math.round(Number(value.replace(/\./g, '').replace(',', '.')) * 100);

const shouldIgnoreDescription = (description: string): boolean => {
  const normalizedDescription = normalizeForComparison(description);
  return IGNORED_DESCRIPTIONS.some((ignoredDescription) =>
    normalizedDescription.includes(ignoredDescription),
  );
};

const createDespesa = (
  data: Pick<
    ExtractedDespesa,
    | 'valor'
    | 'vencimento'
    | 'parcela'
    | 'prazoInicio'
    | 'prazoFim'
    | 'descricao'
    | 'active'
  >,
  paymentId: tipoPagamentoEnum,
  tenantId: string,
): ExtractedDespesa => ({
  ...data,
  tipo: 'despesa',
  categoria_id: categoriasEnum.outros,
  parcela_id: parcelasEnum.p1,
  pagamento_id: paymentId,
  status_id: statusEnum.pago,
  tenant_id: tenantId,
});

const createReceita = (
  data: Pick<ExtractedReceita, 'valor' | 'recebimento' | 'descricao'>,
): ExtractedReceita => ({
  ...data,
  tipo: 'receita',
  categoria_id: categoriasEnum.outros,
  status_id: statusEnum.pago,
});

const isBradescoAccountStatement = (text: string): boolean => {
  const normalizedText = normalizeForComparison(text);
  return (
    normalizedText.includes('BRADESCO CELULAR') &&
    normalizedText.includes('EXTRATO DE: AGENCIA') &&
    normalizedText.includes('CREDITO (R$)') &&
    normalizedText.includes('DEBITO (R$)')
  );
};

const isBankHeaderLine = (line: string): boolean => {
  const normalizedLine = normalizeForComparison(line);
  return (
    normalizedLine === 'BRADESCO CELULAR' ||
    normalizedLine.startsWith('DATA:') ||
    normalizedLine.startsWith('NOME:') ||
    normalizedLine.startsWith('EXTRATO DE:') ||
    normalizedLine.startsWith('DATA HISTORICO DOCTO.') ||
    normalizedLine.startsWith('FOLHA:') ||
    /^-- \d+ OF \d+ --$/.test(normalizedLine) ||
    normalizedLine.startsWith('TOTAL ')
  );
};

const toIsoDate = (day: string, month: string, year: string): string =>
  `${year}-${month}-${day}`;

const cleanBankDescription = (description: string): string =>
  normalizeSpaces(
    description
      .replace(BANK_DATE_PATTERN, '')
      .replace(/\s+\d{2}\/\d{2}\s*$/, '')
      .replace(/\bDES:\s*/i, '- '),
  );

type BankTransactionDirection = 'credit' | 'debit' | 'unknown';

const identifyBankTransactionDirection = (
  description: string,
  amountInCents: number,
  balanceInCents: number,
  previousBalanceInCents: number | null,
): BankTransactionDirection => {
  if (previousBalanceInCents !== null) {
    const balanceDifference = balanceInCents - previousBalanceInCents;

    if (balanceDifference === amountInCents) {
      return 'credit';
    }

    if (balanceDifference === -amountInCents) {
      return 'debit';
    }
  }

  const normalizedDescription = normalizeForComparison(description);

  if (BANK_CREDIT_DESCRIPTION_PATTERN.test(normalizedDescription)) {
    return 'credit';
  }

  if (BANK_DEBIT_DESCRIPTION_PATTERN.test(normalizedDescription)) {
    return 'debit';
  }

  return 'unknown';
};

const extractBradescoAccountStatement = (
  text: string,
  fallbackDueDate: string,
  tenantId: string,
): ExtractedFinancialEntry[] => {
  const entries: ExtractedFinancialEntry[] = [];
  const pendingRecordLines: string[] = [];
  let currentTransactionDate = fallbackDueDate;
  let previousBalanceInCents: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = normalizeSpaces(rawLine);

    if (!line || isBankHeaderLine(line)) {
      continue;
    }

    const dateMatch = line.match(BANK_DATE_PATTERN);
    if (dateMatch) {
      if (pendingRecordLines.length > 0) {
        pendingRecordLines.length = 0;
      }
      currentTransactionDate = toIsoDate(
        dateMatch[1],
        dateMatch[2],
        dateMatch[3],
      );
    }

    pendingRecordLines.push(line);
    const record = normalizeSpaces(pendingRecordLines.join(' '));
    const recordEndMatch = record.match(BANK_RECORD_END_PATTERN);

    if (!recordEndMatch || recordEndMatch.index === undefined) {
      continue;
    }

    const rawDescription = record.slice(0, recordEndMatch.index);
    const description = cleanBankDescription(rawDescription);
    const amountInCents = Math.abs(
      parseBrazilianMoneyInCents(recordEndMatch[2]),
    );
    const balanceInCents = parseBrazilianMoneyInCents(recordEndMatch[3]);
    const direction = identifyBankTransactionDirection(
      description,
      amountInCents,
      balanceInCents,
      previousBalanceInCents,
    );

    previousBalanceInCents = balanceInCents;
    pendingRecordLines.length = 0;

    if (
      direction === 'unknown' ||
      amountInCents <= 0 ||
      !description ||
      shouldIgnoreDescription(description)
    ) {
      continue;
    }

    if (direction === 'credit') {
      entries.push(
        createReceita({
          valor: amountInCents / 100,
          recebimento: currentTransactionDate,
          descricao: description,
        }),
      );
      continue;
    }

    entries.push(
      createDespesa(
        {
          valor: amountInCents / 100,
          vencimento: currentTransactionDate,
          parcela: null,
          prazoInicio: null,
          prazoFim: null,
          descricao: description,
          active: true,
        },
        tipoPagamentoEnum.pix,
        tenantId,
      ),
    );
  }

  return entries;
};

const collectCardTransactionLines = (text: string): string[] => {
  const transactions: string[] = [];
  let currentTransaction = '';

  for (const rawLine of text.split(/\r?\n/)) {
    const line = normalizeSpaces(rawLine);

    if (!line) {
      continue;
    }

    if (CARD_TRANSACTION_START.test(line)) {
      if (currentTransaction) {
        transactions.push(currentTransaction);
      }

      currentTransaction = line;
      continue;
    }

    if (
      currentTransaction &&
      !CARD_TRANSACTION_PATTERN.test(currentTransaction)
    ) {
      currentTransaction = `${currentTransaction} ${line}`;
    }
  }

  if (currentTransaction) {
    transactions.push(currentTransaction);
  }

  return transactions;
};

const extractCardStatement = (
  text: string,
  dueDate: string,
  tenantId: string,
): ExtractedDespesa[] =>
  collectCardTransactionLines(text).flatMap((transaction) => {
    const match = normalizeSpaces(transaction).match(CARD_TRANSACTION_PATTERN);

    if (!match) {
      return [];
    }

    const transactionDescription = match[2];
    if (shouldIgnoreDescription(transactionDescription)) {
      return [];
    }

    const installmentMatch = transactionDescription.match(INSTALLMENT_PATTERN);
    const prazoInicio = installmentMatch ? Number(installmentMatch[1]) : null;
    const prazoFim = installmentMatch ? Number(installmentMatch[2]) : null;
    const valueInCents = parseBrazilianMoneyInCents(match[3]);
    const descricao = normalizeSpaces(
      transactionDescription.replace(INSTALLMENT_PATTERN, ''),
    );

    if (!Number.isFinite(valueInCents) || !descricao) {
      return [];
    }

    return [
      createDespesa(
        {
          valor: valueInCents / 100,
          vencimento: dueDate,
          parcela: installmentMatch?.[0] ?? null,
          prazoInicio,
          prazoFim,
          descricao,
          active: prazoInicio === null || prazoInicio === 1,
        },
        tipoPagamentoEnum.cartao,
        tenantId,
      ),
    ];
  });

export const extractData = (
  text: string,
  vencimento: string,
  tenantId: string,
): ExtractedFinancialEntry[] =>
  isBradescoAccountStatement(text)
    ? extractBradescoAccountStatement(text, vencimento, tenantId)
    : extractCardStatement(text, vencimento, tenantId);
