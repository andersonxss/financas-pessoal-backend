export class CreateReceitasCommand {
    constructor(
        public readonly descricao: string,
        public readonly valor: number,
        public readonly recebimento: Date,
        public readonly categoria_id: string,
        public readonly status_id: string,
    ) { }
}