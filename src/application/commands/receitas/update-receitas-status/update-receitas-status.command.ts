export class UpdateReceitasStatusCommand {
    constructor(
        public readonly id: string,
        public readonly status_id: string,
    ) { }
}