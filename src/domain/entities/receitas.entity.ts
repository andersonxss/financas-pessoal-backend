export class Receitas {
    constructor(
        public readonly id: string,
        public descricao: string,
        public valor: number,
        public recebimento: Date,
        public categoria_id: string,
        public status_id: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }
}