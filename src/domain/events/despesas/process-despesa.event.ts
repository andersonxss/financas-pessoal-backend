import { DomainEvent } from '../domain-event';
import { ProcessFinancialContext } from '../process-financial-context';

export type ProcessDespesaContext = ProcessFinancialContext;

export interface ProcessDespesaData {
  descricao: string;
  valor: number;
  vencimento: string | Date;
  categoria_id: string;
  status_id: string;
  parcela_id: string;
  pagamento_id: string;
}

export interface ProcessDespesaPayload {
  context: ProcessDespesaContext;
  despesa: ProcessDespesaData;
}

export class ProcessDespesaEvent extends DomainEvent {
  public event: string;
  constructor(public readonly data: ProcessDespesaPayload | null = null) {
    super();
    this.event = 'process_despesa';
  }

  eventName(): string {
    return this.event;
  }
}
