export class UpdateDespesasCommand {
    constructor(
        public readonly id: string,
        public readonly descricao: string,
        public readonly valor: number,
        public readonly vencimento: Date,
        public readonly categoria_id: string,
        public readonly status_id: string,
        public readonly parcela_id: string,
        public readonly pagamento_id: string,
    ) { }
}