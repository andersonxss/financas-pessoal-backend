import type { ProcessDespesaContext } from '../../../../domain/events/despesas/process-despesa.event';

export class CreateDataProcessDespesasCommand {
  constructor(
    public readonly jobId: string,
    public readonly itens: string,
    public readonly context: ProcessDespesaContext,
  ) {}
}
