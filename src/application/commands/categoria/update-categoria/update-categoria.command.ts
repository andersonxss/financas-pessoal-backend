export class UpdateCategoriaCommand {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly status_id: string,
    ) { }
}