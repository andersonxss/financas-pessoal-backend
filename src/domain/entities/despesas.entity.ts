export class Despesas {
    constructor(
        public readonly id: string,
        public descricao: string,
        public valor: number,
        public vencimento: Date,
        public categoria_id: string,
        public status_id: string,
        public parcela_id: string,
        public pagamento_id: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }
}