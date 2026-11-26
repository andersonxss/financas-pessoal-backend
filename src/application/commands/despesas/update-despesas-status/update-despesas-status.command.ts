export class UpdateDespesasStatusCommand {
    constructor(
        public readonly id: string,
        public readonly status_id: string,
    ) { }
}