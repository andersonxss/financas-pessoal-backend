import { DomainEvent } from '../domain-event';
import { ProcessFinancialContext } from '../process-financial-context';

export type ProcessReceitaContext = ProcessFinancialContext;

export interface ProcessReceitaData {
  descricao: string;
  valor: number;
  recebimento: string | Date;
  categoria_id: string;
  status_id: string;
}

export interface ProcessReceitaPayload {
  context: ProcessReceitaContext;
  receita: ProcessReceitaData;
}

export class ProcessReceitaEvent extends DomainEvent {
  public event: string;

  constructor(public readonly data: ProcessReceitaPayload | null = null) {
    super();
    this.event = 'process_receita';
  }

  eventName(): string {
    return this.event;
  }
}
