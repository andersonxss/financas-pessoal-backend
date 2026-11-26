export class CreatePagamentosCommand {
    constructor(
        public readonly name: string,
        public readonly status_id: string,
    ) { }
}